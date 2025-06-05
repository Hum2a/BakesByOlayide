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
  const { subject, html } = req.body;
  if (!subject || !html) {
    return res.status(400).json({ error: 'Missing subject or html' });
  }
  try {
    const snapshot = await firestore.collection('newsletter').where('optedIn', '==', true).get();
    const emails = snapshot.docs.map(doc => doc.data().email).filter(Boolean);
    if (!emails.length) {
      return res.status(400).json({ error: 'No opted-in subscribers found.' });
    }
    await marketingTransporter.sendMail({
      from: `"Bakes by Olayide Marketing" <${process.env.ZOHO_MARKETING_USER}>`,
      to: process.env.ZOHO_MARKETING_USER,
      bcc: emails,
      subject,
      html,
    });
    res.json({ success: true, sent: emails.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { sendOrderConfirmation, sendEnquiryReply, sendMarketingEmail }; 