import type { CfEnv } from './lib/cfEnv';
import { corsHeadersFor } from './lib/cors';

type PagesFunction<E = unknown> = (context: {
  request: Request;
  env: E;
  next: () => Promise<Response>;
}) => Response | Promise<Response>;

export const onRequest: PagesFunction<CfEnv> = async (context) => {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api')) {
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeadersFor(context.request, context.env),
      });
    }
  }
  const resp = await context.next();
  if (!url.pathname.startsWith('/api')) return resp;
  const h = new Headers(resp.headers);
  for (const [k, v] of Object.entries(corsHeadersFor(context.request, context.env))) {
    h.set(k, v);
  }
  return new Response(resp.body, { status: resp.status, headers: h });
};
