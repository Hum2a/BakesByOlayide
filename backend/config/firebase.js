const admin = require('firebase-admin');

let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Try to load from the path in the environment variable
  serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('Using Firebase credentials from:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else {
  // Fallback to a local file for development
  serviceAccount = require('./bakesbyolayide-firebase-adminsdk-fbsvc-a7bcd79c25.json');
  console.log('Using local Firebase credentials');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

module.exports = { admin, firestore }; 