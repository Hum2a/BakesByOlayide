const app = require('./app');

/**
 * Production (if you run Node on a host): that host sets PORT — must use it.
 * Local dev: prefer API_PORT so you can set PORT=3000 in .env for tooling without moving the API.
 * Otherwise PORT (e.g. 5000 in backend/.env) or default 5000.
 */
function resolveListenPort() {
  if (process.env.NODE_ENV === 'production') {
    const p = Number(process.env.PORT);
    return Number.isFinite(p) && p > 0 ? p : 5000;
  }
  const apiPort = Number(process.env.API_PORT);
  if (Number.isFinite(apiPort) && apiPort > 0) return apiPort;
  const p = Number(process.env.PORT);
  if (Number.isFinite(p) && p > 0) return p;
  return 5000;
}

const PORT = resolveListenPort();

if (process.env.NODE_ENV === 'production') {
  const smtpChecks = [
    ['ZOHO_ORDERS_USER', 'ZOHO_ORDERS_PASS', 'order confirmation / checkout emails'],
    ['ZOHO_ENQUIRIES_USER', 'ZOHO_ENQUIRIES_PASS', 'enquiry replies / contact notify'],
    ['ZOHO_MARKETING_USER', 'ZOHO_MARKETING_PASS', 'newsletter sends'],
  ];
  for (const [u, p, label] of smtpChecks) {
    if (!process.env[u]?.trim() || !process.env[p]?.trim()) {
      console.warn(`[bakesbyolayide] SMTP not configured for ${label}: set ${u} and ${p} in the environment.`);
    }
  }
}

// 0.0.0.0: accept connections on all interfaces (Windows/WSL/LAN; localhost still works).
app.listen(PORT, '0.0.0.0', () => {
  const env = process.env.NODE_ENV || 'undefined';
  console.log(
    `[bakesbyolayide] API listening on 0.0.0.0:${PORT} (NODE_ENV=${env}) — ${env === 'production' ? 'host logs / HTTP_LOG' : `http://localhost:${PORT}`}`
  );
}); 