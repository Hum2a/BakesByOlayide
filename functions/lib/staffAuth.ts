import * as jose from 'jose';
import type { CfEnv } from './cfEnv';
import { fsGetDocument } from './firestore';
import { jsonError } from './httpUtil';

const JWKS = jose.createRemoteJWKSet(
  new URL('https://www.google.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export async function requireStaffUid(request: Request, env: CfEnv): Promise<string | Response> {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonError('Missing Authorization: Bearer <token>', 401, request, env);
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return jsonError('Empty token', 401, request, env);

  let uid = '';
  try {
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });
    uid = String(payload.sub || '');
  } catch {
    return jsonError('Invalid or expired sign-in. Refresh the page and try again.', 401, request, env);
  }

  if (!uid) return jsonError('Invalid token payload: missing user id', 401, request, env);

  let userDoc: Record<string, unknown> | null = null;
  try {
    userDoc = await fsGetDocument(env, `users/${uid}`);
  } catch (e) {
    const detail = e instanceof Error && e.message ? e.message.slice(0, 220) : 'unknown error';
    return jsonError(`Staff lookup failed: ${detail}`, 500, request, env);
  }

  if (!userDoc) return jsonError('Access denied', 403, request, env);
  const staff =
    userDoc.isAdmin === true ||
    userDoc.isDeveloper === true ||
    userDoc.role === 'admin' ||
    userDoc.role === 'developer';
  if (!staff) return jsonError('Staff access required', 403, request, env);
  return uid;
}
