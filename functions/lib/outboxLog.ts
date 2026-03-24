import type { CfEnv } from './cfEnv';
import { fsCreateDocument } from './firestore';

const MAX_HTML_LENGTH = 150_000;

function truncateHtml(html: unknown): string {
  if (html == null) return '';
  const s = String(html);
  if (s.length <= MAX_HTML_LENGTH) return s;
  return `${s.slice(0, MAX_HTML_LENGTH)}\n\n<!-- truncated for storage -->`;
}

function sanitizeMeta(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function normalizeEmailArray(input: unknown): string[] {
  if (input == null) return [];
  const raw = Array.isArray(input) ? input : [input];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of raw) {
    const s = String(e).trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= 200) break;
  }
  return out;
}

function resolveRecipientLists(payload: Record<string, unknown>) {
  let ccR = normalizeEmailArray(payload.ccRecipients);
  if (!ccR.length && payload.cc != null && String(payload.cc).trim()) {
    ccR = normalizeEmailArray(String(payload.cc).split(/[,;]+/));
  }
  const bccR = normalizeEmailArray(payload.bccRecipients);
  return { ccR, bccR };
}

export type OutboxPayload = Record<string, unknown>;

export async function logEmailOutbox(env: CfEnv, payload: OutboxPayload): Promise<string> {
  const { ccR, bccR } = resolveRecipientLists(payload);

  let recipientCount = payload.recipientCount as number | undefined;
  if (typeof recipientCount !== 'number' || !Number.isFinite(recipientCount)) {
    const skipAuto =
      payload.kind === 'marketing_broadcast' || (payload.meta as { bccListRedacted?: boolean })?.bccListRedacted === true;
    if (!skipAuto) {
      const toStr = payload.to != null ? String(payload.to) : '';
      const toN = toStr ? toStr.split(/[,;]+/).map((s) => s.trim()).filter(Boolean).length || 1 : 0;
      recipientCount = toN + ccR.length + bccR.length;
    }
  }

  const doc: Record<string, unknown> = {
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
    sentAt: new Date(),
    ccRecipients: ccR,
    bccRecipients: bccR,
  };

  if (ccR.length) doc.cc = ccR.join(', ');
  const bccSummary =
    payload.bccSummary != null && String(payload.bccSummary).trim()
      ? String(payload.bccSummary)
      : bccR.length
        ? `${bccR.length} BCC`
        : undefined;
  if (bccSummary) doc.bccSummary = bccSummary;
  if (typeof recipientCount === 'number' && Number.isFinite(recipientCount)) {
    doc.recipientCount = recipientCount;
  }

  return fsCreateDocument(env, 'emailOutbox', doc);
}

export function logEmailOutboxSafe(env: CfEnv, payload: OutboxPayload): void {
  logEmailOutbox(env, payload).catch((err) => {
    console.error('[emailOutbox] failed to write log:', err?.message || err);
  });
}
