const admin = require('firebase-admin');

// Get Firebase credentials from environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
  console.warn(
    '[firebase-admin] FIREBASE_PROJECT_ID or FIREBASE_PRIVATE_KEY is missing. Email outbox logging and other Firestore use will fail until .env is loaded (repo root and/or backend/.env — see server.js).'
  );
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

module.exports = { admin, firestore }; 