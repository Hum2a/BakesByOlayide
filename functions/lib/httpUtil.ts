import type { CfEnv } from './cfEnv';
import { corsHeadersFor } from './cors';

export function json(data: unknown, status = 200, request?: Request, env?: CfEnv): Response {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  if (request && env) {
    const ch = corsHeadersFor(request, env);
    Object.entries(ch).forEach(([k, v]) => headers.set(k, v));
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export function jsonError(message: string, status: number, request?: Request, env?: CfEnv): Response {
  return json({ error: message }, status, request, env);
}
