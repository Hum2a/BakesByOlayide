const { admin, firestore } = require('../config/firebase');

/**
 * Requires Authorization: Bearer <Firebase ID token> and a staff user doc in Firestore.
 */
async function requireStaffAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Empty token' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const snap = await firestore.collection('users').doc(decoded.uid).get();
    if (!snap.exists) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const d = snap.data() || {};
    const staff =
      d.isAdmin === true ||
      d.isDeveloper === true ||
      d.role === 'admin' ||
      d.role === 'developer';
    if (!staff) {
      return res.status(403).json({ error: 'Staff access required' });
    }
    req.staffUid = decoded.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired sign-in. Refresh the page and try again.' });
  }
}

module.exports = { requireStaffAuth };
