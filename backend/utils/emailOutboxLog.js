const admin = require('firebase-admin');
const { firestore } = require('../config/firebase');

const MAX_HTML_LENGTH = 150_000;

function truncateHtml(html) {
  if (html == null) return '';
  const s = String(html);
  if (s.length <= MAX_HTML_LENGTH) return s;
  return `${s.slice(0, MAX_HTML_LENGTH)}\n\n<!-- truncated for storage -->`;
}

/** Firestore rejects `undefined` in maps; meta comes from callers and may omit keys. */
function sanitizeMeta(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

const MAX_RECIPIENTS_EACH = 200;

function normalizeEmailArray(input) {
  if (input == null) return [];
  const raw = Array.isArray(input) ? input : [input];
  const seen = new Set();
  const out = [];
  for (const e of raw) {
    const s = String(e).trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= MAX_RECIPIENTS_EACH) break;
  }
  return out;
}

/**
 * CC/BCC from explicit arrays or legacy comma-separated `cc` string.
 */
function resolveRecipientLists(payload) {
  let ccR = normalizeEmailArray(payload.ccRecipients);
  if (!ccR.length && payload.cc != null && String(payload.cc).trim()) {
    ccR = normalizeEmailArray(String(payload.cc).split(/[,;]+/));
  }
  const bccR = normalizeEmailArray(payload.bccRecipients);
  return { ccR, bccR };
}

/**
 * Persist a sent-or-failed email for the admin Outbox (server-side only).
 * Newsletter broadcasts: pass recipientCount + empty bccRecipients + meta if addresses are redacted.
 */
async function logEmailOutbox(payload) {
  const { ccR, bccR } = resolveRecipientLists(payload);

  let recipientCount = payload.recipientCount;
  if (typeof recipientCount !== 'number' || !Number.isFinite(recipientCount)) {
    const skipAuto =
      payload.kind === 'marketing_broadcast' || payload.meta?.bccListRedacted === true;
    if (!skipAuto) {
      const toStr = payload.to != null ? String(payload.to) : '';
      const toN = toStr ? toStr.split(/[,;]+/).map((s) => s.trim()).filter(Boolean).length || 1 : 0;
      recipientCount = toN + ccR.length + bccR.length;
    }
  }

  const doc = {
    channel: payload.channel != null ? String(payload.channel) : '',
    kind: payload.kind != null ? String(payload.kind) : '',
    status: payload.status != null ? String(payload.status) : '',
    to: payload.to != null ? String(payload.to) : '',
    replyTo: payload.replyTo != null ? String(payload.replyTo) : null,
    subject: payload.subject != null ? String(payload.subject) : '',
    html: truncateHtml(payload.html),
    errorMessage: payload.errorMessage != null ? String(payload.errorMessage) : null,
    clientSource: payload.clientSource != null ? String(payload.clientSource).slice(0, 120) : null,
    meta: sanitizeMeta(payload.meta),
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    ccRecipients: ccR,
    bccRecipients: bccR,
  };

  if (ccR.length) {
    doc.cc = ccR.join(', ');
  }
  if (payload.bccSummary != null && String(payload.bccSummary).trim()) {
    doc.bccSummary = String(payload.bccSummary);
  } else if (bccR.length) {
    doc.bccSummary = `${bccR.length} BCC`;
  }
  if (typeof recipientCount === 'number' && Number.isFinite(recipientCount)) {
    doc.recipientCount = recipientCount;
  }

  const ref = await firestore.collection('emailOutbox').add(doc);
  if (process.env.EMAIL_OUTBOX_DEBUG === '1' || process.env.EMAIL_OUTBOX_DEBUG === 'true') {
    console.log('[emailOutbox] wrote', ref.id);
  }
  return ref;
}

function logEmailOutboxSafe(payload) {
  return logEmailOutbox(payload).catch((err) => {
    console.error(
      '[emailOutbox] failed to write log:',
      err?.message || err,
      err?.code ? `(code: ${err.code})` : '',
      err?.details != null ? String(err.details).slice(0, 200) : ''
    );
  });
}

module.exports = { logEmailOutbox, logEmailOutboxSafe, truncateHtml };
