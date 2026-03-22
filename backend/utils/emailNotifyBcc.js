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

const DEFAULT_STAFF_NOTIFY_EMAILS = ['bakedbyolayide@gmail.com'];

/**
 * @param {string} envKey - e.g. EMAIL_NEW_ORDER_NOTIFY_TO
 * @param {string} primaryInbox - do not duplicate this address in BCC
 */
function notifyListForEnv(envKey, primaryInbox) {
  const raw = process.env[envKey];
  let list;
  if (raw === undefined || raw === null) {
    list = [...DEFAULT_STAFF_NOTIFY_EMAILS];
  } else if (String(raw).trim() === '') {
    list = [];
  } else {
    list = parseList(raw);
  }
  const blocked = normalizeAddr(primaryInbox);
  return list.filter((e) => normalizeAddr(e) !== blocked);
}

/** Checkout basket → Orders inbox (see EMAIL_NEW_ORDER_NOTIFY_TO). */
function newOrderNotifyBcc(ordersInbox) {
  return notifyListForEnv('EMAIL_NEW_ORDER_NOTIFY_TO', ordersInbox);
}

/** Contact form → Enquiries inbox (see EMAIL_NEW_CONTACT_ENQUIRY_NOTIFY_TO). */
function newContactEnquiryNotifyBcc(enquiriesInbox) {
  return notifyListForEnv('EMAIL_NEW_CONTACT_ENQUIRY_NOTIFY_TO', enquiriesInbox);
}

/** New product review → Enquiries inbox (see EMAIL_NEW_REVIEW_NOTIFY_TO). */
function newReviewNotifyBcc(enquiriesInbox) {
  return notifyListForEnv('EMAIL_NEW_REVIEW_NOTIFY_TO', enquiriesInbox);
}

/**
 * Basket enquiry → shop inbox: visible CC copies (notify list + always bakedbyolayide@gmail.com when
 * it is not the orders inbox). Hidden BCC from EMAIL_NOTIFY_BCC_ORDERS only (deduped against To/CC).
 *
 * CC is used so Zoho reliably delivers a copy; BCC-only was easy to drop when EMAIL_NEW_ORDER_NOTIFY_TO was empty.
 */
function orderEnquiryShopCcAndBcc(ordersInbox) {
  const notifyFromEnv = notifyListForEnv('EMAIL_NEW_ORDER_NOTIFY_TO', ordersInbox);
  const alwaysCc = DEFAULT_STAFF_NOTIFY_EMAILS.filter(
    (e) => normalizeAddr(e) !== normalizeAddr(ordersInbox)
  );
  const ccList = uniqueEmailList([...notifyFromEnv, ...alwaysCc]);
  const bccArr = staffBccFor('EMAIL_NOTIFY_BCC_ORDERS', ordersInbox, ccList);
  return {
    cc: ccList.length ? ccList : undefined,
    bcc: bccArr && bccArr.length ? bccArr : undefined,
  };
}

/**
 * Contact form staff copy: EMAIL_NOTIFY_BCC_ENQUIRIES + contact notify list.
 */
function contactEnquiryInboxBcc(enquiriesInbox) {
  const staff = staffBccFor('EMAIL_NOTIFY_BCC_ENQUIRIES', enquiriesInbox, []) || [];
  const notify = newContactEnquiryNotifyBcc(enquiriesInbox);
  const merged = uniqueEmailList([...staff, ...notify]);
  return merged.length ? merged : undefined;
}

/**
 * Admin reply to a customer (Enquiries SMTP): staff BCC env + same notify list as new contact mail
 * (EMAIL_NEW_CONTACT_ENQUIRY_NOTIFY_TO, default bakedbyolayide@gmail.com). Deduped; never BCC the customer To/CC.
 */
function enquiryReplyBcc(to, ccList = []) {
  const enquiriesInbox = process.env.ZOHO_ENQUIRIES_USER;
  const staff = staffBccFor('EMAIL_NOTIFY_BCC_ENQUIRIES', to, ccList) || [];
  const fromEnv = enquiriesInbox
    ? newContactEnquiryNotifyBcc(enquiriesInbox)
    : [...DEFAULT_STAFF_NOTIFY_EMAILS];
  const alwaysGmail = DEFAULT_STAFF_NOTIFY_EMAILS.filter(
    (e) => !enquiriesInbox || normalizeAddr(e) !== normalizeAddr(enquiriesInbox)
  );
  const notifyRaw = uniqueEmailList([...fromEnv, ...alwaysGmail]);
  const blocked = new Set([normalizeAddr(to), ...ccList.map(normalizeAddr)].filter(Boolean));
  const notify = notifyRaw.filter((e) => !blocked.has(normalizeAddr(e)));
  const merged = uniqueEmailList([...staff, ...notify]);
  return merged.length ? merged : undefined;
}

/**
 * New review staff mail: EMAIL_NOTIFY_BCC_ENQUIRIES + review notify list.
 */
function newReviewInboxBcc(enquiriesInbox) {
  const staff = staffBccFor('EMAIL_NOTIFY_BCC_ENQUIRIES', enquiriesInbox, []) || [];
  const notify = newReviewNotifyBcc(enquiriesInbox);
  const merged = uniqueEmailList([...staff, ...notify]);
  return merged.length ? merged : undefined;
}

module.exports = {
  staffBccFor,
  parseList,
  uniqueEmailList,
  notifyListForEnv,
  newOrderNotifyBcc,
  newContactEnquiryNotifyBcc,
  newReviewNotifyBcc,
  orderEnquiryShopCcAndBcc,
  contactEnquiryInboxBcc,
  enquiryReplyBcc,
  newReviewInboxBcc,
};
