import * as jose from 'jose';

let cached: { token: string; exp: number } | null = null;

export async function getGoogleAccessToken(env: {
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp > now + 120) return cached.token;

  const pk = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const key = await jose.importPKCS8(pk, 'RS256');
  const jwt = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/datastore',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(env.FIREBASE_CLIENT_EMAIL)
    .setSubject(env.FIREBASE_CLIENT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!json.access_token) {
    throw new Error(`Google OAuth failed: ${json.error || JSON.stringify(json)}`);
  }
  cached = {
    token: json.access_token,
    exp: now + (json.expires_in || 3500),
  };
  return json.access_token;
}
