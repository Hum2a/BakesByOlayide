import type { CfEnv } from './cfEnv';

const DEFAULT_ORIGINS = [
  'https://bakesbyolayide.co.uk',
  'https://www.bakesbyolayide.co.uk',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

function extraOrigins(env: CfEnv): string[] {
  return (env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function allowedOrigins(env: CfEnv): string[] {
  return [...new Set([...DEFAULT_ORIGINS, ...extraOrigins(env)])];
}

export function corsHeadersFor(request: Request, env: CfEnv): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allow =
    !origin || allowedOrigins(env).includes(origin) ? (origin || '*') : '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  if (allow) {
    headers['Access-Control-Allow-Origin'] = allow;
    if (allow !== '*') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }
  return headers;
}
