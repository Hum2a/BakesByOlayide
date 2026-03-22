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

function missingSmtpEnvForChannel(channel) {
  const c = String(channel || '').toLowerCase();
  if (c === 'orders') {
    if (!process.env.ZOHO_ORDERS_USER?.trim() || !process.env.ZOHO_ORDERS_PASS?.trim()) {
      return 'ZOHO_ORDERS_USER / ZOHO_ORDERS_PASS';
    }
  } else if (c === 'enquiries') {
    if (!process.env.ZOHO_ENQUIRIES_USER?.trim() || !process.env.ZOHO_ENQUIRIES_PASS?.trim()) {
      return 'ZOHO_ENQUIRIES_USER / ZOHO_ENQUIRIES_PASS';
    }
  } else if (c === 'marketing') {
    if (!process.env.ZOHO_MARKETING_USER?.trim() || !process.env.ZOHO_MARKETING_PASS?.trim()) {
      return 'ZOHO_MARKETING_USER / ZOHO_MARKETING_PASS';
    }
  }
  return null;
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

/** Prefer ccRecipients; fall back to legacy string field `cc` from older outbox rows. */
function ccListForResend(data) {
  let cc = asAddrArray(data.ccRecipients);
  if (cc.length) return cc;
  const legacy = data.cc != null ? String(data.cc).trim() : '';
  if (!legacy || legacy.toLowerCase() === 'null') return [];
  return asAddrArray(legacy.split(/[,;]+/).map((s) => s.trim()).filter(Boolean));
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

  const missingEnv = missingSmtpEnvForChannel(channel);
  if (missingEnv) {
    return res.status(500).json({
      error: `SMTP is not configured on this server (${missingEnv}). Add them in Render (or host) env and redeploy.`,
    });
  }

  const from = fromHeaderForResend(channel, kind);
  if (!from) {
    return res.status(500).json({ error: 'Zoho user env var for this channel is not configured.' });
  }

  const cc = ccListForResend(data);
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
      lastResendError: admin.firestore.FieldValue.delete(),
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      resentAt: admin.firestore.FieldValue.serverTimestamp(),
      resentByUid: req.staffUid || null,
      resentCount: admin.firestore.FieldValue.increment(1),
    });
    return res.json({ success: true, warnings });
  } catch (e) {
    const msg = (e && e.message) || String(e);
    console.error('[resend-outbox-email]', docId, channel, kind, msg);
    try {
      await ref.update({
        lastResendAt: admin.firestore.FieldValue.serverTimestamp(),
        lastResendError: msg.slice(0, 2000),
      });
    } catch (logErr) {
      console.error('[resend-outbox-email] could not write lastResendError:', logErr.message);
    }
    return res.status(500).json({ error: msg });
  }
}

module.exports = { resendOutboxEmail };
