const { ordersTransporter, enquiriesTransporter, marketingTransporter } = require('../config/nodemailer');
const { firestore } = require('../config/firebase');

async function sendOrderConfirmation(req, res) {
  const { to, subject, html } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });
  try {
    await ordersTransporter.sendMail({
      from: `"Bakes by Olayide" <${process.env.ZOHO_ORDERS_USER}>`,
      to,
      subject,
      html,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function sendEnquiryReply(req, res) {
  const { to, subject, html } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });
  try {
    await enquiriesTransporter.sendMail({
      from: `"Bakes by Olayide Enquiries" <${process.env.ZOHO_ENQUIRIES_USER}>`,
      to,
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

module.exports = { sendOrderConfirmation, sendEnquiryReply, sendMarketingEmail }; 