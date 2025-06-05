const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  // Use the secret file (works on Render)
  serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  console.log('Loaded Firebase credentials from', process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else {
  // Fallback to local file for development
  serviceAccount = require('../../bakesbyolayide-firebase-adminsdk-fbsvc-a7bcd79c25.json');
  console.log('Loaded Firebase credentials from local file');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

module.exports = { admin, firestore }; 