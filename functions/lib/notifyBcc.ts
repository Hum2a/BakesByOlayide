import type { CfEnv } from './cfEnv';

function envGet(env: CfEnv, key: string): string | undefined {
  return (env as unknown as Record<string, string | undefined>)[key];
}

function normalizeAddr(email: string) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function parseList(raw: string | undefined): string[] {
  if (raw == null || raw === '') return [];
  return String(raw)
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function staffBccFor(env: CfEnv, envKey: string, to: string, ccList: string[] = []): string[] | undefined {
  const extras = [...new Set(parseList(envGet(env, envKey)))];
  if (!extras.length) return undefined;
  const blocked = new Set([normalizeAddr(to), ...ccList.map(normalizeAddr)].filter(Boolean));
  const filtered = extras.filter((e) => !blocked.has(normalizeAddr(e)));
  return filtered.length ? filtered : undefined;
}

export function uniqueEmailList(emails: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of emails) {
    const n = normalizeAddr(e);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(String(e).trim());
  }
  return out;
}

const DEFAULT_STAFF_NOTIFY_EMAILS = ['bakedbyolayide@gmail.com'];

function notifyListForEnv(env: CfEnv, envKey: string, primaryInbox: string): string[] {
  const raw = envGet(env, envKey);
  let list: string[];
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

export function orderEnquiryShopCcAndBcc(env: CfEnv, ordersInbox: string) {
  const notifyFromEnv = notifyListForEnv(env, 'EMAIL_NEW_ORDER_NOTIFY_TO', ordersInbox);
  const alwaysCc = DEFAULT_STAFF_NOTIFY_EMAILS.filter(
    (e) => normalizeAddr(e) !== normalizeAddr(ordersInbox)
  );
  const ccList = uniqueEmailList([...notifyFromEnv, ...alwaysCc]);
  const bccArr = staffBccFor(env, 'EMAIL_NOTIFY_BCC_ORDERS', ordersInbox, ccList);
  return {
    cc: ccList.length ? ccList : undefined,
    bcc: bccArr && bccArr.length ? bccArr : undefined,
  };
}

export function contactEnquiryInboxBcc(env: CfEnv, enquiriesInbox: string): string[] | undefined {
  const staff = staffBccFor(env, 'EMAIL_NOTIFY_BCC_ENQUIRIES', enquiriesInbox, []) || [];
  const notify = notifyListForEnv(env, 'EMAIL_NEW_CONTACT_ENQUIRY_NOTIFY_TO', enquiriesInbox);
  const merged = uniqueEmailList([...staff, ...notify]);
  return merged.length ? merged : undefined;
}

export function enquiryReplyBcc(env: CfEnv, to: string, ccList: string[] = []): string[] | undefined {
  const enquiriesInbox = env.ZOHO_ENQUIRIES_USER || '';
  const staff = staffBccFor(env, 'EMAIL_NOTIFY_BCC_ENQUIRIES', to, ccList) || [];
  const fromEnv = enquiriesInbox
    ? notifyListForEnv(env, 'EMAIL_NEW_CONTACT_ENQUIRY_NOTIFY_TO', enquiriesInbox)
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

export function newReviewInboxBcc(env: CfEnv, enquiriesInbox: string): string[] | undefined {
  const staff = staffBccFor(env, 'EMAIL_NOTIFY_BCC_ENQUIRIES', enquiriesInbox, []) || [];
  const notify = notifyListForEnv(env, 'EMAIL_NEW_REVIEW_NOTIFY_TO', enquiriesInbox);
  const merged = uniqueEmailList([...staff, ...notify]);
  return merged.length ? merged : undefined;
}
