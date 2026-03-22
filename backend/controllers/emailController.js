const { ordersTransporter, enquiriesTransporter, marketingTransporter } = require('../config/nodemailer');
const { firestore } = require('../config/firebase');

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

  try {
    await ordersTransporter.sendMail({
      from: `"Bakes by Olayide" <${process.env.ZOHO_ORDERS_USER}>`,
      to,
      cc: ccList.length > 0 ? ccList : undefined,
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
  try {
    await enquiriesTransporter.sendMail({
      from: `"Bakes by Olayide Enquiries" <${process.env.ZOHO_ENQUIRIES_USER}>`,
      to,
      cc: ccList.length > 0 ? ccList : undefined,
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

  try {
    const shopMail = ordersTransporter.sendMail({
      from: `"Bakes by Olayide Orders" <${ordersInbox}>`,
      to: ordersInbox,
      replyTo: customerEmail || undefined,
      subject: shopSubject || 'New order enquiry',
      html: shopHtml,
    });

    const customerMail =
      customerEmail && customerHtml
        ? ordersTransporter.sendMail({
            from: `"Bakes by Olayide" <${ordersInbox}>`,
            to: customerEmail,
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
  sendTestEmail,
  sendMarketingTestEmail,
};