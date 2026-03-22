const admin = require('firebase-admin');
const { firestore } = require('../config/firebase');
const { ordersTransporter, enquiriesTransporter, marketingTransporter } = require('../config/nodemailer');

function transporterForChannel(channel) {
  switch (String(channel || '').toLowerCase()) {
    case 'orders':
      return ordersTransporter;
    case 'enquiries':
      return enquiriesTransporter;
    case 'marketing':
      return marketingTransporter;
    default:
      return null;
  }
}

function fromHeaderForResend(channel, kind) {
  const k = String(kind || '');
  if (channel === 'orders') {
    const u = process.env.ZOHO_ORDERS_USER;
    if (!u) return null;
    if (k === 'order_enquiry_shop' || k === 'order_enquiry') {
      return `"Bakes by Olayide Orders" <${u}>`;
    }
    return `"Bakes by Olayide" <${u}>`;
  }
  if (channel === 'enquiries') {
    const u = process.env.ZOHO_ENQUIRIES_USER;
    if (!u) return null;
    return `"Bakes by Olayide Enquiries" <${u}>`;
  }
  if (channel === 'marketing') {
    const u = process.env.ZOHO_MARKETING_USER;
    if (!u) return null;
    return `"Bakes by Olayide Marketing" <${u}>`;
  }
  return null;
}

function asAddrArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((e) => String(e).trim()).filter(Boolean);
}

/**
 * POST /api/resend-outbox-email  { docId }
 * Staff only (Bearer token). Replays a failed log entry (same SMTP channel as original).
 */
async function resendOutboxEmail(req, res) {
  const docId = (req.body && req.body.docId) || '';
  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Missing docId' });
  }

  const ref = firestore.collection('emailOutbox').doc(docId);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.status(404).json({ error: 'Outbox entry not found' });
  }

  const data = snap.data() || {};
  if (data.status !== 'failed') {
    return res.status(400).json({ error: 'Only failed entries can be resent from the Outbox.' });
  }

  const channel = data.channel;
  const kind = data.kind;
  const to = data.to != null ? String(data.to).trim() : '';
  const html = data.html != null ? String(data.html) : '';
  const subject = data.subject != null ? String(data.subject) : '';

  if (!to || !html) {
    return res.status(400).json({ error: 'Stored entry is missing To or HTML body; cannot resend.' });
  }

  if (kind === 'marketing_broadcast' && data.meta && data.meta.bccListRedacted) {
    return res.status(400).json({
      error:
        'Newsletter broadcasts do not store subscriber addresses in the outbox. Resend from Newsletter instead.',
    });
  }

  const transporter = transporterForChannel(channel);
  if (!transporter) {
    return res.status(400).json({ error: `Unknown channel "${channel}"; cannot choose SMTP transport.` });
  }

  const from = fromHeaderForResend(channel, kind);
  if (!from) {
    return res.status(500).json({ error: 'Zoho user env var for this channel is not configured.' });
  }

  const cc = asAddrArray(data.ccRecipients);
  const bcc = asAddrArray(data.bccRecipients);
  const replyTo = data.replyTo != null ? String(data.replyTo).trim() : '';

  const mail = {
    from,
    to,
    subject: subject || '(no subject)',
    html,
  };
  if (cc.length) mail.cc = cc;
  if (bcc.length) mail.bcc = bcc;
  if (replyTo) mail.replyTo = replyTo;

  const warnings = [];
  if (kind === 'order_confirmation' && data.meta && Number(data.meta.attachmentCount) > 0) {
    warnings.push('Original email had attachments; this resend includes body only.');
  }

  try {
    await transporter.sendMail(mail);
    await ref.update({
      status: 'sent',
      errorMessage: admin.firestore.FieldValue.delete(),
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      resentAt: admin.firestore.FieldValue.serverTimestamp(),
      resentByUid: req.staffUid || null,
      resentCount: admin.firestore.FieldValue.increment(1),
    });
    return res.json({ success: true, warnings });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Resend failed' });
  }
}

module.exports = { resendOutboxEmail };
