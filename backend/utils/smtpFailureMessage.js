/**
 * Render (RENDER=true) free web services block outbound TCP to SMTP ports 25, 465, 587.
 * Nodemailer then fails with "Connection timeout" after ~60s — not a Zoho misconfiguration.
 * @see https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports
 */
const RENDER_SMTP_BLOCK_DOC =
  'https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports';

const RENDER_HINT = ` Render free tier blocks outbound SMTP (ports 25, 465, 587), so connections to Zoho time out. Fix: upgrade this service to a paid Render instance, or send mail over HTTPS (SendGrid, Resend, Mailgun, etc.). ${RENDER_SMTP_BLOCK_DOC}`;

function looksLikeSmtpConnectFailure(message) {
  if (!message || typeof message !== 'string') return false;
  return /connection timeout|etimedout|econnrefused|greeting never received|socket hang up|timed out connecting|timeout connecting to/i.test(
    message
  );
}

function smtpFailureMessage(err) {
  const base = err && err.message != null ? String(err.message) : String(err || '');
  if (process.env.RENDER !== 'true') return base;
  if (!looksLikeSmtpConnectFailure(base)) return base;
  return `${base}.${RENDER_HINT}`;
}

module.exports = { smtpFailureMessage, looksLikeSmtpConnectFailure };
