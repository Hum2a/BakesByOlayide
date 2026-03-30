/**
 * Some hosts set RENDER=true and block outbound SMTP (25, 465, 587); Nodemailer then times out.
 * Optional hint when RENDER=true — production mail on Cloudflare uses ZeptoMail HTTPS instead.
 * @see https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports
 */
const RENDER_SMTP_BLOCK_DOC =
  'https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports';

const RENDER_HINT = ` This environment may block outbound SMTP (ports 25, 465, 587), so connections to Zoho time out. Use a host that allows SMTP, or send mail over HTTPS (e.g. ZeptoMail on Cloudflare). ${RENDER_SMTP_BLOCK_DOC}`;

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
