const nodemailer = require('nodemailer');

const ordersTransporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST,
  port: process.env.ZOHO_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.ZOHO_ORDERS_USER,
    pass: process.env.ZOHO_ORDERS_PASS,
  },
});

const enquiriesTransporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST,
  port: process.env.ZOHO_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.ZOHO_ENQUIRIES_USER,
    pass: process.env.ZOHO_ENQUIRIES_PASS,
  },
});

const marketingTransporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST,
  port: process.env.ZOHO_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.ZOHO_MARKETING_USER,
    pass: process.env.ZOHO_MARKETING_PASS,
  },
});

module.exports = { ordersTransporter, enquiriesTransporter, marketingTransporter }; 