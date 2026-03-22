const { ordersTransporter, enquiriesTransporter, marketingTransporter } = require('../config/nodemailer');
const { firestore } = require('../config/firebase');

function envPresent(key) {
  const v = process.env[key];
  return typeof v === 'string' && v.trim().length > 0;
}

async function verifySmtp(label, transporter) {
  const start = Date.now();
  try {
    await transporter.verify();
    return { ok: true, ms: Date.now() - start, error: null };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: e.message || String(e) };
  }
}

async function checkFirestore() {
  const start = Date.now();
  try {
    await firestore.collection('cakes').limit(1).get();
    return { ok: true, ms: Date.now() - start, error: null };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: e.message || String(e) };
  }
}

/**
 * GET /api/integrations/status (staff only — requireStaffAuth on route)
 * Verifies Zoho SMTP transporters and Firebase Admin / Firestore (no secrets returned).
 */
async function getIntegrationsStatus(req, res) {
  const env = {
    ZOHO_SMTP_HOST: envPresent('ZOHO_SMTP_HOST'),
    ZOHO_SMTP_PORT: envPresent('ZOHO_SMTP_PORT'),
    ZOHO_ORDERS_USER: envPresent('ZOHO_ORDERS_USER'),
    ZOHO_ORDERS_PASS: envPresent('ZOHO_ORDERS_PASS'),
    ZOHO_ENQUIRIES_USER: envPresent('ZOHO_ENQUIRIES_USER'),
    ZOHO_ENQUIRIES_PASS: envPresent('ZOHO_ENQUIRIES_PASS'),
    ZOHO_MARKETING_USER: envPresent('ZOHO_MARKETING_USER'),
    ZOHO_MARKETING_PASS: envPresent('ZOHO_MARKETING_PASS'),
    EMAIL_NOTIFY_BCC_ORDERS: envPresent('EMAIL_NOTIFY_BCC_ORDERS'),
    EMAIL_NOTIFY_BCC_ENQUIRIES: envPresent('EMAIL_NOTIFY_BCC_ENQUIRIES'),
    FIREBASE_PROJECT_ID: envPresent('FIREBASE_PROJECT_ID'),
    FIREBASE_CLIENT_EMAIL: envPresent('FIREBASE_CLIENT_EMAIL'),
    FIREBASE_PRIVATE_KEY: envPresent('FIREBASE_PRIVATE_KEY'),
  };

  const [orders, enquiries, marketing, firebaseAdmin] = await Promise.all([
    verifySmtp('orders', ordersTransporter),
    verifySmtp('enquiries', enquiriesTransporter),
    verifySmtp('marketing', marketingTransporter),
    checkFirestore(),
  ]);

  res.json({
    timestamp: new Date().toISOString(),
    env,
    smtp: {
      orders: { ...orders, label: 'Orders (order confirmations, checkout enquiries)' },
      enquiries: { ...enquiries, label: 'Enquiries (admin replies)' },
      marketing: { ...marketing, label: 'Marketing (newsletter BCC sends)' },
    },
    firebaseAdmin: {
      ...firebaseAdmin,
      label: 'Firebase Admin / Firestore (server)',
      projectId: process.env.FIREBASE_PROJECT_ID || null,
    },
  });
}

module.exports = { getIntegrationsStatus };
