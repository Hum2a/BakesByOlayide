/** CC list for outbox resend: prefer ccRecipients, else legacy `cc` string. */

function asAddrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((e) => String(e).trim()).filter(Boolean);
}

export function ccListForResend(data: Record<string, unknown>): string[] {
  let cc = asAddrArray(data.ccRecipients);
  if (cc.length) return cc;
  const legacy = data.cc != null ? String(data.cc).trim() : '';
  if (!legacy || legacy.toLowerCase() === 'null') return [];
  return asAddrArray(legacy.split(/[,;]+/).map((s) => s.trim()).filter(Boolean));
}
