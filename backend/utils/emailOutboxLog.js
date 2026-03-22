const admin = require('firebase-admin');
const { firestore } = require('../config/firebase');

const MAX_HTML_LENGTH = 150_000;

function truncateHtml(html) {
  if (html == null) return '';
  const s = String(html);
  if (s.length <= MAX_HTML_LENGTH) return s;
  return `${s.slice(0, MAX_HTML_LENGTH)}\n\n<!-- truncated for storage -->`;
}

/**
 * Persist a sent-or-failed email for the admin Outbox (server-side only).
 * Avoids storing large BCC lists (e.g. newsletter); use recipientCount + bccSummary instead.
 */
async function logEmailOutbox(payload) {
  const doc = {
    channel: payload.channel,
    kind: payload.kind,
    status: payload.status,
    to: payload.to != null ? String(payload.to) : '',
    cc: payload.cc != null ? String(payload.cc) : null,
    replyTo: payload.replyTo != null ? String(payload.replyTo) : null,
    bccSummary: payload.bccSummary != null ? String(payload.bccSummary) : null,
    recipientCount: typeof payload.recipientCount === 'number' ? payload.recipientCount : null,
    subject: payload.subject != null ? String(payload.subject) : '',
    html: truncateHtml(payload.html),
    errorMessage: payload.errorMessage || null,
    clientSource: payload.clientSource != null ? String(payload.clientSource).slice(0, 120) : null,
    meta: payload.meta && typeof payload.meta === 'object' && !Array.isArray(payload.meta) ? payload.meta : {},
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await firestore.collection('emailOutbox').add(doc);
}

function logEmailOutboxSafe(payload) {
  return logEmailOutbox(payload).catch((err) => {
    console.error('[emailOutbox] failed to write log', err?.message || err);
  });
}

module.exports = { logEmailOutbox, logEmailOutboxSafe, truncateHtml };
