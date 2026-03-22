const app = require('./app');

/**
 * Production (Render, etc.): host sets PORT — must use it.
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

// 0.0.0.0: accept connections on all interfaces (Windows/WSL/LAN; localhost still works).
app.listen(PORT, '0.0.0.0', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API listening on http://localhost:${PORT} (bound to 0.0.0.0:${PORT})`);
  }
}); 