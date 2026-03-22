/**
 * Copy for when the UI reports failure but mail may still have been sent (timeouts, proxy 502/504, etc.).
 * All transactional email is sent from the Node API—never directly from the browser.
 */

export const EMAIL_SEND_UNCERTAINTY_NOTE =
  'Emails are sent by your server (Zoho SMTP), not by this browser tab. If you see an error here but the message still shows up, the connection often drops after the provider accepts the mail—especially on slow networks or free hosting. Check Zoho Sent and the recipient’s inbox before sending again.';

export const EMAIL_SEND_UNCERTAINTY_NOTE_SHORT =
  'If mail still arrived, the server may have sent it before the response failed—check Sent / inbox before resending.';

/**
 * Safe JSON parse for API responses (avoids throwing on HTML proxy errors).
 */
export async function readEmailApiBody(response) {
  const text = await response.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { _nonJsonBody: text.slice(0, 400) };
  }
}

export function emailApiErrorDetail(data, response) {
  if (data && typeof data.error === 'string' && data.error.trim()) return data.error.trim();
  if (data && data._nonJsonBody) return `Server returned non-JSON (HTTP ${response.status}).`;
  return `Request failed (HTTP ${response.status}).`;
}

export function appendUncertaintyToFailureMessage(baseMessage) {
  const b = (baseMessage || '').trim();
  if (!b) return EMAIL_SEND_UNCERTAINTY_NOTE;
  if (b.includes('before trying again')) return b;
  return `${b}\n\n${EMAIL_SEND_UNCERTAINTY_NOTE}`;
}
