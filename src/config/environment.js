/**
 * Single place for runtime / API targets (Create React App inlines REACT_APP_* at build time).
 *
 * Defaults (no .env needed):
 * - Development (npm start): local API at http://localhost:5000 (CRA proxy)
 * - Production: use `npm run build:pages` (REACT_APP_API_RELATIVE=1) for Cloudflare Pages + Functions
 *
 * Override with REACT_APP_API_BASE_URL and/or REACT_APP_RUNTIME_ENV=local|live
 *
 * Cloudflare Pages: `build:pages` sets REACT_APP_API_RELATIVE=1 so /api/* hits Pages Functions on the same host.
 *
 * If the Express server uses PORT=5001 (or anything other than 5000), set e.g.
 * REACT_APP_API_BASE_URL=http://localhost:5001 and restart the dev server. Also set
 * package.json "proxy" to the same origin if you rely on CRA’s /api proxy.
 */

/** Optional separate API host for split deploys. Empty = use same-origin /api (Cloudflare `build:pages`). */
export const LIVE_API_ORIGIN = '';
export const LOCAL_API_ORIGIN = 'http://localhost:5000';

const LIVE_API_DEFAULT = LIVE_API_ORIGIN;
const LOCAL_API_DEFAULT = LOCAL_API_ORIGIN;

const TRAILING_SLASH = /\/+$/;

export function normalizeBaseUrl(url) {
  if (url == null || url === '') return '';
  return String(url).trim().replace(TRAILING_SLASH, '');
}

export function getRuntimeEnv() {
  const v = (process.env.REACT_APP_RUNTIME_ENV || '').toLowerCase().trim();
  if (v === 'local' || v === 'live') return v;
  return process.env.NODE_ENV === 'production' ? 'live' : 'local';
}

export const runtimeEnv = getRuntimeEnv();
export const isLocalRuntime = runtimeEnv === 'local';
export const isLiveRuntime = runtimeEnv === 'live';

/**
 * Backend origin (no trailing slash). Uses REACT_APP_API_BASE_URL when set; otherwise maps from runtime env.
 */
export function getApiBaseUrl() {
  const rel = (process.env.REACT_APP_API_RELATIVE || '').toLowerCase().trim();
  if (rel === 'true' || rel === '1') return '';
  const fromEnv = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);
  if (fromEnv) return fromEnv;
  return isLiveRuntime ? LIVE_API_DEFAULT : LOCAL_API_DEFAULT;
}

/**
 * Absolute URL for an API path. Path should start with /api/...
 */
export function apiUrl(path) {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}

/** Same as apiUrl but for an explicit origin (e.g. probing local vs live servers). */
export function apiUrlAtBase(baseOrigin, path) {
  const base = normalizeBaseUrl(baseOrigin);
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}

/**
 * Production builds: silence browser console unless REACT_APP_ENABLE_CONSOLE_LOGS === 'true'
 * (e.g. temporary debugging on the deployed site).
 */
export function shouldMuteBrowserConsole() {
  if (process.env.NODE_ENV !== 'production') return false;
  return process.env.REACT_APP_ENABLE_CONSOLE_LOGS !== 'true';
}
