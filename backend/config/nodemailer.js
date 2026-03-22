const nodemailer = require('nodemailer');

/**
 * Zoho: 465 = SSL from connect → secure: true. 587 = STARTTLS → secure: false.
 * Using secure:true on 587 often works locally by luck but fails or hangs on some hosts (e.g. Render).
 * Longer timeouts help cold Render → Zoho connections; TLS 1.2+ avoids legacy handshake issues.
 */
function parseSmtpPort() {
  const n = parseInt(String(process.env.ZOHO_SMTP_PORT || '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 587;
}

function smtpSecureForPort(port) {
  const o = (process.env.ZOHO_SMTP_SECURE || '').toLowerCase().trim();
  if (o === 'true' || o === '1') return true;
  if (o === 'false' || o === '0') return false;
  return port === 465;
}

function createZohoTransport(userEnvKey, passEnvKey) {
  const host = (process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com').trim();
  const port = parseSmtpPort();
  const secure = smtpSecureForPort(port);
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env[userEnvKey],
      pass: process.env[passEnvKey],
    },
    connectionTimeout: 60_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
    tls: {
      minVersion: 'TLSv1.2',
    },
  });
}

const ordersTransporter = createZohoTransport('ZOHO_ORDERS_USER', 'ZOHO_ORDERS_PASS');
const enquiriesTransporter = createZohoTransport('ZOHO_ENQUIRIES_USER', 'ZOHO_ENQUIRIES_PASS');
const marketingTransporter = createZohoTransport('ZOHO_MARKETING_USER', 'ZOHO_MARKETING_PASS');

module.exports = { ordersTransporter, enquiriesTransporter, marketingTransporter }; 