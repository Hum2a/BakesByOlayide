const { ordersTransporter, enquiriesTransporter, marketingTransporter } = require('../config/nodemailer');
const { firestore } = require('../config/firebase');
const {
  staffBccFor,
  orderEnquiryShopBcc,
  contactEnquiryInboxBcc,
  newReviewInboxBcc,
} = require('../utils/emailNotifyBcc');

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendOrderConfirmation(req, res) {
  // For multipart/form-data, fields are in req.body, files in req.files
  const { to, subject, html, cc } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });

  // Prepare attachments for nodemailer
  let attachments = [];
  if (req.files && req.files.length > 0) {
    attachments = req.files.map(file => ({
      filename: file.originalname,
      content: file.buffer
    }));
  }

  // Parse CC (comma-separated)
  let ccList = [];
  if (cc) {
    ccList = cc.split(',').map(email => email.trim()).filter(Boolean);
  }

  const bcc = staffBccFor('EMAIL_NOTIFY_BCC_ORDERS', to, ccList);

  try {
    await ordersTransporter.sendMail({
      from: `"Bakes by Olayide" <${process.env.ZOHO_ORDERS_USER}>`,
      to,
      cc: ccList.length > 0 ? ccList : undefined,
      bcc,
      subject,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function sendEnquiryReply(req, res) {
  const { to, subject, html, cc } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });
  let ccList = [];
  if (cc) {
    ccList = cc.split(',').map((e) => e.trim()).filter(Boolean);
  }
  const bcc = staffBccFor('EMAIL_NOTIFY_BCC_ENQUIRIES', to, ccList);

  try {
    await enquiriesTransporter.sendMail({
      from: `"Bakes by Olayide Enquiries" <${process.env.ZOHO_ENQUIRIES_USER}>`,
      to,
      cc: ccList.length > 0 ? ccList : undefined,
      bcc,
      subject,
      html,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function sendMarketingEmail(req, res) {
  const { subject, html, subjectColor, bodyColor, lists } = req.body;
  if (!subject || !html) {
    return res.status(400).json({ error: 'Missing subject or html' });
  }
  try {
    let query = firestore.collection('newsletter').where('optedIn', '==', true);
    if (Array.isArray(lists) && lists.length > 0) {
      query = query.where('lists', 'array-contains-any', lists);
    }
    const snapshot = await query.get();
    const emails = snapshot.docs.map(doc => doc.data().email).filter(Boolean);
    if (!emails.length) {
      return res.status(400).json({ error: 'No opted-in subscribers found for the selected list(s).'});
    }
    // Compose the styled email body
    const styledHtml = `
      <div>
        <h2 style="color: ${subjectColor || '#000'}; margin-bottom: 16px;">${subject}</h2>
        <div style="color: ${bodyColor || '#000'};">${html}</div>
      </div>
    `;
    await marketingTransporter.sendMail({
      from: `"Bakes by Olayide Marketing" <${process.env.ZOHO_MARKETING_USER}>`,
      to: process.env.ZOHO_MARKETING_USER,
      bcc: emails,
      subject,
      html: styledHtml,
    });
    res.json({ success: true, sent: emails.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * New basket enquiry: notify orders inbox (Zoho) and optionally acknowledge the customer.
 * replyTo is set to the customer so staff can reply from their mail client.
 */
async function sendOrderEnquiry(req, res) {
  const {
    shopSubject,
    shopHtml,
    customerEmail,
    customerSubject,
    customerHtml,
  } = req.body;

  if (!shopHtml || typeof shopHtml !== 'string') {
    return res.status(400).json({ error: 'Missing shop email body' });
  }

  const ordersInbox = process.env.ZOHO_ORDERS_USER;
  if (!ordersInbox) {
    return res.status(500).json({ error: 'ZOHO_ORDERS_USER is not configured' });
  }

  const shopBcc = orderEnquiryShopBcc(ordersInbox);
  const customerBcc =
    customerEmail && customerHtml
      ? staffBccFor('EMAIL_NOTIFY_BCC_ORDERS', customerEmail, [])
      : undefined;

  try {
    const shopMail = ordersTransporter.sendMail({
      from: `"Bakes by Olayide Orders" <${ordersInbox}>`,
      to: ordersInbox,
      replyTo: customerEmail || undefined,
      bcc: shopBcc,
      subject: shopSubject || 'New order enquiry',
      html: shopHtml,
    });

    const customerMail =
      customerEmail && customerHtml
        ? ordersTransporter.sendMail({
            from: `"Bakes by Olayide" <${ordersInbox}>`,
            to: customerEmail,
            bcc: customerBcc,
            subject: customerSubject || 'We received your order request',
            html: customerHtml,
          })
        : Promise.resolve();

    await Promise.all([shopMail, customerMail]);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/**
 * Contact form: email Enquiries inbox (+ BCC staff notify). Firestore save happens in the client first.
 */
async function notifyContactEnquiry(req, res) {
  const { firstName, lastName, email, phone, subject, message, inquiry } = req.body || {};
  const msg = (message || inquiry || '').trim();
  const subj = (subject || '').trim();
  const em = (email || '').trim();
  if (!em || !subj || !msg) {
    return res.status(400).json({ error: 'Missing required fields (email, subject, message)' });
  }

  const enquiriesInbox = process.env.ZOHO_ENQUIRIES_USER;
  if (!enquiriesInbox) {
    return res.status(500).json({ error: 'ZOHO_ENQUIRIES_USER is not configured' });
  }

  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || '—';
  const phoneLine = (phone || '').trim();
  const bcc = contactEnquiryInboxBcc(enquiriesInbox);
  const html = `
    <h1 style="margin:0 0 12px;">New contact form enquiry</h1>
    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(em)}</p>
    ${phoneLine ? `<p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(phoneLine)}</p>` : ''}
    <p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(subj)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
    <p style="white-space:pre-wrap;">${escapeHtml(msg)}</p>
  `;

  try {
    await enquiriesTransporter.sendMail({
      from: `"Bakes by Olayide Enquiries" <${enquiriesInbox}>`,
      to: enquiriesInbox,
      replyTo: em,
      bcc,
      subject: `[Contact] ${subj}`,
      html,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/**
 * New product review (customer or admin): notify Enquiries inbox (+ BCC staff notify).
 */
async function notifyNewReview(req, res) {
  const { itemId, itemName, userName, rating, reviewText, orderId, source } = req.body || {};
  const text = (reviewText ?? '').toString().trim();
  const name = (itemName || '').toString().trim();
  const id = (itemId || '').toString().trim();
  const r = Number(rating);
  if (!id || !name || !Number.isFinite(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: 'Missing or invalid fields (itemId, itemName, rating 1–5)' });
  }

  const enquiriesInbox = process.env.ZOHO_ENQUIRIES_USER;
  if (!enquiriesInbox) {
    return res.status(500).json({ error: 'ZOHO_ENQUIRIES_USER is not configured' });
  }

  const who = (userName || 'Customer').trim();
  const bcc = newReviewInboxBcc(enquiriesInbox);
  const src = (source || 'website').toString();
  const html = `
    <h1 style="margin:0 0 12px;">New product review</h1>
    <p style="margin:0 0 8px;"><strong>Product:</strong> ${escapeHtml(name)} <span style="color:#666;">(${escapeHtml(id)})</span></p>
    <p style="margin:0 0 8px;"><strong>Reviewer:</strong> ${escapeHtml(who)}</p>
    <p style="margin:0 0 8px;"><strong>Rating:</strong> ${r} / 5</p>
    ${orderId ? `<p style="margin:0 0 8px;"><strong>Order:</strong> ${escapeHtml(String(orderId))}</p>` : ''}
    <p style="margin:0 0 8px;"><strong>Source:</strong> ${escapeHtml(src)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
    <p style="white-space:pre-wrap;">${escapeHtml(text || '(No written comment)')}</p>
  `;

  try {
    await enquiriesTransporter.sendMail({
      from: `"Bakes by Olayide Enquiries" <${enquiriesInbox}>`,
      to: enquiriesInbox,
      bcc,
      subject: `[Review] ${name} — ${r}/5`,
      html,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function sendTestEmail(req, res) {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });
  const ordersInbox = process.env.ZOHO_ORDERS_USER;
  if (!ordersInbox) {
    return res.status(500).json({ error: 'ZOHO_ORDERS_USER is not configured' });
  }
  try {
    await ordersTransporter.sendMail({
      from: `"Bakes by Olayide" <${ordersInbox}>`,
      to,
      subject: 'Bakes by Olayide – test email',
      html: '<p>This is a test email from the admin dashboard.</p>',
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/**
 * Single-recipient marketing-style send for admin testing (avoids newsletter subscriber query).
 */
async function sendMarketingTestEmail(req, res) {
  const { to, subject, html, subjectColor, bodyColor } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing to, subject, or html' });
  }
  const fromUser = process.env.ZOHO_MARKETING_USER;
  if (!fromUser) {
    return res.status(500).json({ error: 'ZOHO_MARKETING_USER is not configured' });
  }
  try {
    const styledHtml = `
      <div>
        <h2 style="color: ${subjectColor || '#000'}; margin-bottom: 16px;">${subject}</h2>
        <div style="color: ${bodyColor || '#000'};">${html}</div>
        <p style="margin-top:24px;font-size:12px;color:#666;">Admin test · Marketing SMTP (not a live broadcast)</p>
      </div>
    `;
    await marketingTransporter.sendMail({
      from: `"Bakes by Olayide Marketing" <${fromUser}>`,
      to,
      subject: `[TEST] ${subject}`,
      html: styledHtml,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  sendOrderConfirmation,
  sendEnquiryReply,
  sendMarketingEmail,
  sendOrderEnquiry,
  notifyContactEnquiry,
  notifyNewReview,
  sendTestEmail,
  sendMarketingTestEmail,
};