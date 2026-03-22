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

function uniqueEmailList(emails) {
  const seen = new Set();
  const out = [];
  for (const e of emails) {
    const n = normalizeAddr(e);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(String(e).trim());
  }
  return out;
}

/**
 * BCC recipients for the shop copy of a new basket/checkout order (Orders SMTP).
 * Defaults to bakedbyolayide@gmail.com when EMAIL_NEW_ORDER_NOTIFY_TO is unset.
 * Set EMAIL_NEW_ORDER_NOTIFY_TO to a comma-separated list to override; set to empty string to disable.
 */
function newOrderNotifyBcc(ordersInbox) {
  const raw = process.env.EMAIL_NEW_ORDER_NOTIFY_TO;
  let list;
  if (raw === undefined || raw === null) {
    list = ['bakedbyolayide@gmail.com'];
  } else if (String(raw).trim() === '') {
    list = [];
  } else {
    list = parseList(raw);
  }
  const blocked = normalizeAddr(ordersInbox);
  return list.filter((e) => normalizeAddr(e) !== blocked);
}

/**
 * Shop enquiry mail: staff BCC env + new-order notify list, deduped.
 */
function orderEnquiryShopBcc(ordersInbox) {
  const staff = staffBccFor('EMAIL_NOTIFY_BCC_ORDERS', ordersInbox, []) || [];
  const notify = newOrderNotifyBcc(ordersInbox);
  const merged = uniqueEmailList([...staff, ...notify]);
  return merged.length ? merged : undefined;
}

module.exports = { staffBccFor, parseList, newOrderNotifyBcc, orderEnquiryShopBcc, uniqueEmailList };
