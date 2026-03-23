/**
 * Copy for when the UI reports failure but mail may still have been sent (timeouts, proxy 502/504, etc.).
 * Transactional email is sent from your API (Node + Zoho SMTP, or Cloudflare Pages Functions + ZeptoMail)—never directly from the browser.
 */

/** First line of network / gateway-timeout style failures — used for styling + detection (see isUncertainEmailOutcomeMessage). */
export const UNCERTAIN_EMAIL_OUTCOME_SNIPPET =
  'IMPORTANT: This is often a false alarm. The email may already have been sent successfully.';

export const EMAIL_SEND_UNCERTAINTY_NOTE =
  'Emails are sent by your server API (Zoho SMTP on Node, or ZeptoMail on Cloudflare), not by this browser tab. If you see an error here but the message still shows up, the connection often drops after the provider accepts the mail—especially on slow networks or free hosting. Check your provider’s sent folder and the recipient’s inbox before sending again.';

export const EMAIL_SEND_UNCERTAINTY_NOTE_SHORT =
  'If mail still arrived, the server may have sent it before the response failed—check Sent / inbox before resending.';

/** HTTP statuses where the reverse proxy or host often drops the response after upstream work finished. */
const GATEWAY_UNCERTAIN_STATUSES = new Set([502, 503, 504, 524]);

export function isUncertainEmailOutcomeMessage(message) {
  if (typeof message !== 'string' || !message.trim()) return false;
  return message.includes(UNCERTAIN_EMAIL_OUTCOME_SNIPPET);
}

/**
 * Full user-facing message when fetch() throws (e.g. Failed to fetch) — lead + detail + explanation.
 */
export function formatEmailSendNetworkError(err) {
  const technical = `The browser did not receive a final response (${err?.message || 'network error'}).`;
  return [UNCERTAIN_EMAIL_OUTCOME_SNIPPET, '', technical, '', EMAIL_SEND_UNCERTAINTY_NOTE].join('\n');
}

/**
 * Non-OK HTTP response after a response object exists. Adds gateway-time “false alarm” lead when appropriate.
 */
export function formatEmailSendHttpFailure(data, response) {
  const base = emailApiErrorDetail(data, response);
  const withNote = appendUncertaintyToFailureMessage(base);
  if (response && GATEWAY_UNCERTAIN_STATUSES.has(response.status)) {
    return `${UNCERTAIN_EMAIL_OUTCOME_SNIPPET}\n\n${withNote}`;
  }
  return withNote;
}

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
  if (b.includes(UNCERTAIN_EMAIL_OUTCOME_SNIPPET)) return b;
  return `${b}\n\n${EMAIL_SEND_UNCERTAINTY_NOTE}`;
}
