import type { CfEnv } from '../lib/cfEnv';
import { handleApiRoute } from '../lib/handlers';

type PagesFunction<E = unknown> = (context: {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
}) => Response | Promise<Response>;

export const onRequest: PagesFunction<CfEnv> = async (context) => {
  const raw = context.params.catchall;
  const path = Array.isArray(raw) ? raw.join('/') : raw || '';
  return handleApiRoute(context.request, context.env, path);
};
