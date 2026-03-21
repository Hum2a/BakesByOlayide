/**
 * Single place for runtime / API targets (Create React App inlines REACT_APP_* at build time).
 *
 * Defaults (no .env needed):
 * - Development (npm start): local API at http://localhost:5000
 * - Production build (npm run build): live API at Render URL
 *
 * Override with REACT_APP_API_BASE_URL and/or REACT_APP_RUNTIME_ENV=local|live
 */

const LIVE_API_DEFAULT = 'https://bakesbyolayide-server.onrender.com';
const LOCAL_API_DEFAULT = 'http://localhost:5000';

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
