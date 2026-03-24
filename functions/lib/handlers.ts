import type { CfEnv } from './cfEnv';
import { corsHeadersFor } from './cors';
import { json, jsonError } from './httpUtil';
import { fsGetDocument, fsPatchDocument, fsRunQuery } from './firestore';
import {
  contactEnquiryInboxBcc,
  enquiryReplyBcc,
  newReviewInboxBcc,
  orderEnquiryShopCcAndBcc,
  staffBccFor,
} from './notifyBcc';
import { logEmailOutboxSafe, type OutboxPayload } from './outboxLog';
import { requireStaffUid } from './staffAuth';
import { sendZeptoMail, type ZeptoAttachment } from './zeptomail';
import { ccListForResend } from './outboxResend';

function bccSummary(bcc: string[] | undefined): string | null {
  if (!bcc) return null;
  const n = Array.isArray(bcc) ? bcc.length : 1;
  return n ? `${n} BCC` : null;
}

function readClientSource(body: Record<string, unknown>): string | null {
  const raw = body.clientSource;
  if (raw == null || typeof raw !== 'string') return null;
  const s = raw.replace(/[\r\n\u0000]/g, '').trim().slice(0, 100);
  return s || null;
}

function outboxClient(body: Record<string, unknown>) {
  const clientSource = readClientSource(body);
  return clientSource ? { clientSource } : {};
}

function escapeHtml(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function envPresent(env: CfEnv, key: string): boolean {
  const v = (env as unknown as Record<string, string | undefined>)[key];
  return typeof v === 'string' && v.trim().length > 0;
}

export async function handleApiRoute(
  request: Request,
  env: CfEnv,
  routePath: string
): Promise<Response> {
  const method = request.method;
  const path = routePath.replace(/^\/+/, '');

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeadersFor(request, env) });
  }

  try {
    if (path === 'test' && method === 'GET') {
      return json({ message: 'Server is running!' }, 200, request, env);
    }

    if (path === 'integrations/status' && method === 'GET') {
      const uid = await requireStaffUid(request, env);
      if (uid instanceof Response) return uid;
      return getIntegrationsStatus(request, env);
    }

    if (path === 'resend-outbox-email' && method === 'POST') {
      const uid = await requireStaffUid(request, env);
      if (uid instanceof Response) return uid;
      const body = (await request.json()) as Record<string, unknown>;
      return resendOutboxEmail(request, env, body, uid);
    }

    if (method !== 'POST') {
      return jsonError('Method not allowed', 405, request, env);
    }

    if (path === 'send-order-confirmation') {
      return sendOrderConfirmation(request, env);
    }
    if (path === 'send-enquiry-reply') {
      return sendEnquiryReply(request, env);
    }
    if (path === 'send-marketing-email') {
      return sendMarketingEmail(request, env);
    }
    if (path === 'send-order-enquiry') {
      return sendOrderEnquiry(request, env);
    }
    if (path === 'notify-contact-enquiry') {
      return notifyContactEnquiry(request, env);
    }
    if (path === 'notify-new-review') {
      return notifyNewReview(request, env);
    }
    if (path === 'test-email') {
      return sendTestEmail(request, env);
    }
    if (path === 'test-marketing-email') {
      return sendMarketingTestEmail(request, env);
    }

    return jsonError('Not found', 404, request, env);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api]', path, msg);
    return jsonError(msg, 500, request, env);
  }
}

async function getIntegrationsStatus(request: Request, env: CfEnv): Promise<Response> {
  const envFlags = {
    ZEPTOMAIL_TOKEN: envPresent(env, 'ZEPTOMAIL_TOKEN'),
    ZOHO_ORDERS_USER: envPresent(env, 'ZOHO_ORDERS_USER'),
    ZOHO_ENQUIRIES_USER: envPresent(env, 'ZOHO_ENQUIRIES_USER'),
    ZOHO_MARKETING_USER: envPresent(env, 'ZOHO_MARKETING_USER'),
    EMAIL_NOTIFY_BCC_ORDERS: envPresent(env, 'EMAIL_NOTIFY_BCC_ORDERS'),
    EMAIL_NOTIFY_BCC_ENQUIRIES: envPresent(env, 'EMAIL_NOTIFY_BCC_ENQUIRIES'),
    FIREBASE_PROJECT_ID: envPresent(env, 'FIREBASE_PROJECT_ID'),
    FIREBASE_CLIENT_EMAIL: envPresent(env, 'FIREBASE_CLIENT_EMAIL'),
    FIREBASE_PRIVATE_KEY: envPresent(env, 'FIREBASE_PRIVATE_KEY'),
  };

  const t0 = Date.now();
  let fireOk = false;
  let fireErr: string | null = null;
  try {
    await fsRunQuery(env, {
      from: [{ collectionId: 'cakes' }],
      limit: 1,
    });
    fireOk = true;
  } catch (e) {
    fireErr = e instanceof Error ? e.message : String(e);
  }

  const zeptoOk = envPresent(env, 'ZEPTOMAIL_TOKEN');
  const shared = {
    ok: zeptoOk,
    ms: Date.now() - t0,
    error: zeptoOk ? null : 'ZEPTOMAIL_TOKEN missing',
  };

  return json(
    {
      timestamp: new Date().toISOString(),
      env: envFlags,
      smtp: {
        orders: { ...shared, label: 'Orders (ZeptoMail HTTP)' },
        enquiries: { ...shared, label: 'Enquiries (ZeptoMail HTTP)' },
        marketing: { ...shared, label: 'Marketing (ZeptoMail HTTP)' },
      },
      firebaseAdmin: {
        ok: fireOk,
        ms: Date.now() - t0,
        error: fireErr,
        label: 'Firebase / Firestore (REST)',
        projectId: env.FIREBASE_PROJECT_ID || null,
      },
    },
    200,
    request,
    env
  );
}

async function sendOrderConfirmation(request: Request, env: CfEnv): Promise<Response> {
  const form = await request.formData();
  const to = String(form.get('to') || '');
  const subject = String(form.get('subject') || '');
  const html = String(form.get('html') || '');
  const cc = String(form.get('cc') || '');
  const clientSource = readClientSource({ clientSource: form.get('clientSource') as string });

  if (!to) return jsonError('Missing recipient email', 400, request, env);

  const rawAttachments = form.getAll('attachments');
  const attachments: ZeptoAttachment[] = [];
  for (const entry of rawAttachments) {
    if (typeof entry === 'string') continue;
    const f = entry as File;
    if (typeof f.arrayBuffer !== 'function') continue;
    const ab = await f.arrayBuffer();
    attachments.push({
      name: f.name || 'attachment',
      contentBase64: bufferToBase64(ab),
      mimeType: f.type || 'application/octet-stream',
    });
  }

  let ccList: string[] = [];
  if (cc) ccList = cc.split(',').map((e) => e.trim()).filter(Boolean);
  const bcc = staffBccFor(env, 'EMAIL_NOTIFY_BCC_ORDERS', to, ccList);

  const ordersFrom = env.ZOHO_ORDERS_USER?.trim();
  if (!ordersFrom) return jsonError('ZOHO_ORDERS_USER is not configured', 500, request, env);

  const outboxBase: OutboxPayload = {
    channel: 'orders',
    kind: 'order_confirmation',
    to,
    ccRecipients: ccList,
    bccRecipients: Array.isArray(bcc) ? bcc : [],
    bccSummary: bccSummary(bcc),
    subject,
    html,
    meta: { attachmentCount: attachments.length },
    ...(clientSource ? { clientSource } : {}),
  };

  try {
    await sendZeptoMail(env, {
      from: { address: ordersFrom, name: 'Bakes by Olayide' },
      to: [to],
      cc: ccList.length ? ccList : undefined,
      bcc,
      subject,
      html,
      attachments: attachments.length ? attachments : undefined,
    });
    logEmailOutboxSafe(env, { ...outboxBase, status: 'sent' });
    return json({ success: true }, 200, request, env);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logEmailOutboxSafe(env, { ...outboxBase, status: 'failed', errorMessage: errMsg });
    return jsonError(errMsg, 500, request, env);
  }
}

async function sendEnquiryReply(request: Request, env: CfEnv): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const to = String(body.to || '');
  const subject = String(body.subject || '');
  const html = String(body.html || '');
  const ccRaw = body.cc;
  let ccList: string[] = [];
  if (typeof ccRaw === 'string' && ccRaw) {
    ccList = ccRaw.split(',').map((e) => e.trim()).filter(Boolean);
  }
  if (!to) return jsonError('Missing recipient email', 400, request, env);

  const fromAddr = env.ZOHO_ENQUIRIES_USER?.trim();
  if (!fromAddr) return jsonError('ZOHO_ENQUIRIES_USER is not configured', 500, request, env);

  const bcc = enquiryReplyBcc(env, to, ccList);
  const outboxBase: OutboxPayload = {
    channel: 'enquiries',
    kind: 'enquiry_reply',
    to,
    ccRecipients: ccList,
    bccRecipients: Array.isArray(bcc) ? bcc : [],
    bccSummary: bccSummary(bcc),
    subject,
    html,
    meta: {},
    ...outboxClient(body),
  };

  try {
    await sendZeptoMail(env, {
      from: { address: fromAddr, name: 'Bakes by Olayide Enquiries' },
      to: [to],
      cc: ccList.length ? ccList : undefined,
      bcc,
      subject,
      html,
    });
    logEmailOutboxSafe(env, { ...outboxBase, status: 'sent' });
    return json({ success: true }, 200, request, env);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logEmailOutboxSafe(env, { ...outboxBase, status: 'failed', errorMessage: errMsg });
    return jsonError(errMsg, 500, request, env);
  }
}

async function sendMarketingEmail(request: Request, env: CfEnv): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const subject = String(body.subject || '');
  const html = String(body.html || '');
  const subjectColor = String(body.subjectColor || '#000');
  const bodyColor = String(body.bodyColor || '#000');
  const lists = Array.isArray(body.lists) ? (body.lists as string[]) : [];

  if (!subject || !html) return jsonError('Missing subject or html', 400, request, env);

  const styledHtml = `
      <div>
        <h2 style="color: ${subjectColor}; margin-bottom: 16px;">${subject}</h2>
        <div style="color: ${bodyColor};">${html}</div>
      </div>
    `;

  const fromAddr = env.ZOHO_MARKETING_USER?.trim();
  if (!fromAddr) return jsonError('ZOHO_MARKETING_USER is not configured', 500, request, env);

  const where =
    lists.length > 0
      ? {
          compositeFilter: {
            op: 'AND',
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: 'optedIn' },
                  op: 'EQUAL',
                  value: { booleanValue: true },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'lists' },
                  op: 'ARRAY_CONTAINS_ANY',
                  value: { arrayValue: { values: lists.map((s) => ({ stringValue: s })) } },
                },
              },
            ],
          },
        }
      : {
          fieldFilter: {
            field: { fieldPath: 'optedIn' },
            op: 'EQUAL',
            value: { booleanValue: true },
          },
        };

  let emails: string[] = [];
  try {
    const rows = await fsRunQuery(env, {
      from: [{ collectionId: 'newsletter' }],
      where,
    });
    emails = rows
      .map((r) => (r as Record<string, unknown>).email)
      .filter((e): e is string => typeof e === 'string' && !!e.trim());
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return jsonError(errMsg, 500, request, env);
  }

  if (!emails.length) {
    return jsonError('No opted-in subscribers found for the selected list(s).', 400, request, env);
  }

  const outboxBase: OutboxPayload = {
    ...outboxClient(body),
    channel: 'marketing',
    kind: 'marketing_broadcast',
    to: fromAddr,
    ccRecipients: [],
    bccRecipients: [],
    bccSummary: `${emails.length} newsletter subscribers (BCC; addresses not stored)`,
    recipientCount: emails.length,
    subject,
    html: styledHtml,
    meta: { lists, bccListRedacted: true },
  };

  try {
    await sendZeptoMail(env, {
      from: { address: fromAddr, name: 'Bakes by Olayide Marketing' },
      to: [fromAddr],
      bcc: emails,
      subject,
      html: styledHtml,
    });
    logEmailOutboxSafe(env, { ...outboxBase, status: 'sent' });
    return json({ success: true, sent: emails.length }, 200, request, env);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logEmailOutboxSafe(env, { ...outboxBase, status: 'failed', errorMessage: errMsg });
    return jsonError(errMsg, 500, request, env);
  }
}

async function sendOrderEnquiry(request: Request, env: CfEnv): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const shopSubject = String(body.shopSubject || '');
  const shopHtml = String(body.shopHtml || '');
  const customerEmail = String(body.customerEmail || '');
  const customerSubject = String(body.customerSubject || '');
  const customerHtml = String(body.customerHtml || '');

  if (!shopHtml) return jsonError('Missing shop email body', 400, request, env);
  const ordersInbox = env.ZOHO_ORDERS_USER?.trim();
  if (!ordersInbox) return jsonError('ZOHO_ORDERS_USER is not configured', 500, request, env);

  const { cc: shopCc, bcc: shopBcc } = orderEnquiryShopCcAndBcc(env, ordersInbox);
  const customerBcc =
    customerEmail && customerHtml ? staffBccFor(env, 'EMAIL_NOTIFY_BCC_ORDERS', customerEmail, []) : undefined;

  try {
    await sendZeptoMail(env, {
      from: { address: ordersInbox, name: 'Bakes by Olayide Orders' },
      to: [ordersInbox],
      cc: shopCc,
      bcc: shopBcc,
      replyTo: customerEmail || undefined,
      subject: shopSubject || 'New order enquiry',
      html: shopHtml,
    });
    if (customerEmail && customerHtml) {
      await sendZeptoMail(env, {
        from: { address: ordersInbox, name: 'Bakes by Olayide' },
        to: [customerEmail],
        bcc: customerBcc,
        subject: customerSubject || 'We received your order request',
        html: customerHtml,
      });
    }

    logEmailOutboxSafe(env, {
      ...outboxClient(body),
      channel: 'orders',
      kind: 'order_enquiry_shop',
      status: 'sent',
      to: ordersInbox,
      ccRecipients: Array.isArray(shopCc) ? shopCc : [],
      bccRecipients: Array.isArray(shopBcc) ? shopBcc : [],
      replyTo: customerEmail || null,
      bccSummary: bccSummary(shopBcc),
      subject: shopSubject || 'New order enquiry',
      html: shopHtml,
      meta: {},
    });
    if (customerEmail && customerHtml) {
      logEmailOutboxSafe(env, {
        ...outboxClient(body),
        channel: 'orders',
        kind: 'order_enquiry_customer_ack',
        status: 'sent',
        to: customerEmail,
        ccRecipients: [],
        bccRecipients: Array.isArray(customerBcc) ? customerBcc : [],
        bccSummary: bccSummary(customerBcc),
        subject: customerSubject || 'We received your order request',
        html: customerHtml,
        meta: {},
      });
    }
    return json({ success: true }, 200, request, env);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logEmailOutboxSafe(env, {
      ...outboxClient(body),
      channel: 'orders',
      kind: 'order_enquiry',
      status: 'failed',
      to: ordersInbox,
      ccRecipients: Array.isArray(shopCc) ? shopCc : [],
      bccRecipients: Array.isArray(shopBcc) ? shopBcc : [],
      replyTo: customerEmail || null,
      bccSummary: bccSummary(shopBcc),
      subject: shopSubject || 'New order enquiry',
      html: shopHtml,
      errorMessage: errMsg,
      meta: { hadCustomerAck: !!(customerEmail && customerHtml) },
    });
    return jsonError(errMsg, 500, request, env);
  }
}

async function notifyContactEnquiry(request: Request, env: CfEnv): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const firstName = String(body.firstName || '');
  const lastName = String(body.lastName || '');
  const em = String(body.email || '').trim();
  const phone = String(body.phone || '');
  const subj = String(body.subject || '').trim();
  const msg = String(body.message || body.inquiry || '').trim();
  if (!em || !subj || !msg) {
    return jsonError('Missing required fields (email, subject, message)', 400, request, env);
  }

  const enquiriesInbox = env.ZOHO_ENQUIRIES_USER?.trim();
  if (!enquiriesInbox) return jsonError('ZOHO_ENQUIRIES_USER is not configured', 500, request, env);

  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || '—';
  const phoneLine = phone.trim();
  const bcc = contactEnquiryInboxBcc(env, enquiriesInbox);
  const html = `
    <h1 style="margin:0 0 12px;">New contact form enquiry</h1>
    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(em)}</p>
    ${phoneLine ? `<p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(phoneLine)}</p>` : ''}
    <p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(subj)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
    <p style="white-space:pre-wrap;">${escapeHtml(msg)}</p>
  `;

  const outboxBase: OutboxPayload = {
    channel: 'enquiries',
    kind: 'contact_form_notify',
    to: enquiriesInbox,
    ccRecipients: [],
    bccRecipients: Array.isArray(bcc) ? bcc : [],
    replyTo: em,
    bccSummary: bccSummary(bcc),
    subject: `[Contact] ${subj}`,
    html,
    meta: { visitorEmail: em },
    ...outboxClient(body),
  };

  try {
    await sendZeptoMail(env, {
      from: { address: enquiriesInbox, name: 'Bakes by Olayide Enquiries' },
      to: [enquiriesInbox],
      bcc,
      replyTo: em,
      subject: `[Contact] ${subj}`,
      html,
    });
    logEmailOutboxSafe(env, { ...outboxBase, status: 'sent' });
    return json({ success: true }, 200, request, env);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logEmailOutboxSafe(env, { ...outboxBase, status: 'failed', errorMessage: errMsg });
    return jsonError(errMsg, 500, request, env);
  }
}

async function notifyNewReview(request: Request, env: CfEnv): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const itemId = String(body.itemId || '');
  const itemName = String(body.itemName || '').trim();
  const userName = String(body.userName || 'Customer').trim();
  const rating = Number(body.rating);
  const reviewText = (body.reviewText ?? '').toString().trim();
  const orderId = body.orderId != null ? String(body.orderId) : '';
  const source = (body.source || 'website').toString();

  if (!itemId || !itemName || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return jsonError('Missing or invalid fields (itemId, itemName, rating 1–5)', 400, request, env);
  }

  const enquiriesInbox = env.ZOHO_ENQUIRIES_USER?.trim();
  if (!enquiriesInbox) return jsonError('ZOHO_ENQUIRIES_USER is not configured', 500, request, env);

  const bcc = newReviewInboxBcc(env, enquiriesInbox);
  const html = `
    <h1 style="margin:0 0 12px;">New product review</h1>
    <p style="margin:0 0 8px;"><strong>Product:</strong> ${escapeHtml(itemName)} <span style="color:#666;">(${escapeHtml(itemId)})</span></p>
    <p style="margin:0 0 8px;"><strong>Reviewer:</strong> ${escapeHtml(userName)}</p>
    <p style="margin:0 0 8px;"><strong>Rating:</strong> ${rating} / 5</p>
    ${orderId ? `<p style="margin:0 0 8px;"><strong>Order:</strong> ${escapeHtml(orderId)}</p>` : ''}
    <p style="margin:0 0 8px;"><strong>Source:</strong> ${escapeHtml(source)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
    <p style="white-space:pre-wrap;">${escapeHtml(reviewText || '(No written comment)')}</p>
  `;
  const subj = `[Review] ${itemName} — ${rating}/5`;

  const outboxBase: OutboxPayload = {
    channel: 'enquiries',
    kind: 'new_review_notify',
    to: enquiriesInbox,
    ccRecipients: [],
    bccRecipients: Array.isArray(bcc) ? bcc : [],
    bccSummary: bccSummary(bcc),
    subject: subj,
    html,
    meta: { itemId, rating, source },
    ...outboxClient(body),
  };

  try {
    await sendZeptoMail(env, {
      from: { address: enquiriesInbox, name: 'Bakes by Olayide Enquiries' },
      to: [enquiriesInbox],
      bcc,
      subject: subj,
      html,
    });
    logEmailOutboxSafe(env, { ...outboxBase, status: 'sent' });
    return json({ success: true }, 200, request, env);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logEmailOutboxSafe(env, { ...outboxBase, status: 'failed', errorMessage: errMsg });
    return jsonError(errMsg, 500, request, env);
  }
}

async function sendTestEmail(request: Request, env: CfEnv): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const to = String(body.to || '');
  if (!to) return jsonError('Missing recipient email', 400, request, env);
  const ordersInbox = env.ZOHO_ORDERS_USER?.trim();
  if (!ordersInbox) return jsonError('ZOHO_ORDERS_USER is not configured', 500, request, env);
  const testHtml = '<p>This is a test email from the admin dashboard.</p>';
  const outboxBase: OutboxPayload = {
    channel: 'orders',
    kind: 'admin_test_email',
    to,
    ccRecipients: [],
    bccRecipients: [],
    subject: 'Bakes by Olayide – test email',
    html: testHtml,
    meta: {},
    ...outboxClient(body),
  };
  try {
    await sendZeptoMail(env, {
      from: { address: ordersInbox, name: 'Bakes by Olayide' },
      to: [to],
      subject: 'Bakes by Olayide – test email',
      html: testHtml,
    });
    logEmailOutboxSafe(env, { ...outboxBase, status: 'sent' });
    return json({ success: true }, 200, request, env);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logEmailOutboxSafe(env, { ...outboxBase, status: 'failed', errorMessage: errMsg });
    return jsonError(errMsg, 500, request, env);
  }
}

async function sendMarketingTestEmail(request: Request, env: CfEnv): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const to = String(body.to || '');
  const subject = String(body.subject || '');
  const html = String(body.html || '');
  const subjectColor = String(body.subjectColor || '#000');
  const bodyColor = String(body.bodyColor || '#000');
  if (!to || !subject || !html) return jsonError('Missing to, subject, or html', 400, request, env);
  const fromUser = env.ZOHO_MARKETING_USER?.trim();
  if (!fromUser) return jsonError('ZOHO_MARKETING_USER is not configured', 500, request, env);
  const styledHtml = `
      <div>
        <h2 style="color: ${subjectColor}; margin-bottom: 16px;">${subject}</h2>
        <div style="color: ${bodyColor};">${html}</div>
        <p style="margin-top:24px;font-size:12px;color:#666;">Admin test · Marketing (ZeptoMail)</p>
      </div>
    `;
  const outboxBase: OutboxPayload = {
    channel: 'marketing',
    kind: 'admin_marketing_test',
    to,
    ccRecipients: [],
    bccRecipients: [],
    subject: `[TEST] ${subject}`,
    html: styledHtml,
    meta: {},
    ...outboxClient(body),
  };
  try {
    await sendZeptoMail(env, {
      from: { address: fromUser, name: 'Bakes by Olayide Marketing' },
      to: [to],
      subject: `[TEST] ${subject}`,
      html: styledHtml,
    });
    logEmailOutboxSafe(env, { ...outboxBase, status: 'sent' });
    return json({ success: true }, 200, request, env);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logEmailOutboxSafe(env, { ...outboxBase, status: 'failed', errorMessage: errMsg });
    return jsonError(errMsg, 500, request, env);
  }
}

async function resendOutboxEmail(
  request: Request,
  env: CfEnv,
  body: Record<string, unknown>,
  staffUid: string
): Promise<Response> {
  const docId = String(body.docId || '');
  if (!docId) return jsonError('Missing docId', 400, request, env);

  const data = await fsGetDocument(env, `emailOutbox/${docId}`);
  if (!data) return jsonError('Outbox entry not found', 404, request, env);
  if (data.status !== 'failed') {
    return jsonError('Only failed entries can be resent from the Outbox.', 400, request, env);
  }

  const channel = String(data.channel || '');
  const kind = String(data.kind || '');
  const to = String(data.to || '').trim();
  const html = String(data.html || '');
  const subject = String(data.subject || '');

  if (!to || !html) {
    return jsonError('Stored entry is missing To or HTML body; cannot resend.', 400, request, env);
  }

  const meta = data.meta as Record<string, unknown> | undefined;
  if (kind === 'marketing_broadcast' && meta?.bccListRedacted === true) {
    return jsonError(
      'Newsletter broadcasts do not store subscriber addresses in the outbox. Resend from Newsletter instead.',
      400,
      request,
      env
    );
  }

  const fromAddr =
    channel === 'orders'
      ? env.ZOHO_ORDERS_USER?.trim()
      : channel === 'enquiries'
        ? env.ZOHO_ENQUIRIES_USER?.trim()
        : channel === 'marketing'
          ? env.ZOHO_MARKETING_USER?.trim()
          : '';
  if (!fromAddr) {
    return jsonError('From address env var for this channel is not configured.', 500, request, env);
  }

  const fromName =
    kind === 'order_enquiry_shop' || kind === 'order_enquiry'
      ? 'Bakes by Olayide Orders'
      : channel === 'enquiries'
        ? 'Bakes by Olayide Enquiries'
        : channel === 'marketing'
          ? 'Bakes by Olayide Marketing'
          : 'Bakes by Olayide';

  const cc = ccListForResend(data);
  const bcc = Array.isArray(data.bccRecipients)
    ? (data.bccRecipients as unknown[]).map((e) => String(e).trim()).filter(Boolean)
    : [];
  const replyTo = data.replyTo != null ? String(data.replyTo).trim() : '';

  const warnings: string[] = [];
  if (kind === 'order_confirmation' && meta && Number(meta.attachmentCount) > 0) {
    warnings.push('Original email had attachments; this resend includes body only.');
  }

  try {
    await sendZeptoMail(env, {
      from: { address: fromAddr, name: fromName },
      to: [to],
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      replyTo: replyTo || undefined,
      subject: subject || '(no subject)',
      html,
    });

    const prevCount = typeof data.resentCount === 'number' ? data.resentCount : 0;
    await fsPatchDocument(
      env,
      `emailOutbox/${docId}`,
      {
        status: 'sent',
        errorMessage: null,
        lastResendError: null,
        sentAt: new Date(),
        resentAt: new Date(),
        resentByUid: staffUid,
        resentCount: prevCount + 1,
      },
      [
        'status',
        'errorMessage',
        'lastResendError',
        'sentAt',
        'resentAt',
        'resentByUid',
        'resentCount',
      ]
    );
    return json({ success: true, warnings }, 200, request, env);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[resend-outbox-email]', docId, channel, kind, msg);
    try {
      await fsPatchDocument(
        env,
        `emailOutbox/${docId}`,
        {
          lastResendAt: new Date(),
          lastResendError: msg.slice(0, 2000),
        },
        ['lastResendAt', 'lastResendError']
      );
    } catch (logErr) {
      console.error('[resend-outbox-email] could not write lastResendError:', logErr);
    }
    return jsonError(msg, 500, request, env);
  }
}
