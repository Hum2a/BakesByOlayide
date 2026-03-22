/**
 * Staff notification BCC from env (comma/semicolon-separated).
 * BCC keeps internal distribution off the customer's To/CC line.
 */

function normalizeAddr(email) {
  return String(email || '').trim().toLowerCase();
}

function parseList(raw) {
  if (raw == null || raw === '') return [];
  return String(raw)
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {string} envKey - e.g. EMAIL_NOTIFY_BCC_ORDERS
 * @param {string} to - primary recipient
 * @param {string[]} [ccList]
 * @returns {string[]|undefined} nodemailer bcc or undefined if empty
 */
function staffBccFor(envKey, to, ccList = []) {
  const extras = [...new Set(parseList(process.env[envKey]))];
  if (!extras.length) return undefined;
  const blocked = new Set(
    [normalizeAddr(to), ...ccList.map(normalizeAddr)].filter(Boolean)
  );
  const filtered = extras.filter((e) => !blocked.has(normalizeAddr(e)));
  return filtered.length ? filtered : undefined;
}

module.exports = { staffBccFor, parseList };
