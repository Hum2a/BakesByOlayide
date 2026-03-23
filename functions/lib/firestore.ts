import type { CfEnv } from './cfEnv';
import { getGoogleAccessToken } from './googleAccessToken';

function baseUrl(projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function authHeader(env: CfEnv): Promise<HeadersInit> {
  const t = await getGoogleAccessToken(env);
  return { Authorization: `Bearer ${t}` };
}

/** Firestore v1 REST value encoding */
export function encodeValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((v) => encodeValue(v)) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) fields[k] = encodeValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function decodeValue(v: Record<string, unknown> | undefined): unknown {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v && v.arrayValue && typeof v.arrayValue === 'object') {
    const values = (v.arrayValue as { values?: Record<string, unknown>[] }).values || [];
    return values.map((x) => decodeValue(x));
  }
  if ('mapValue' in v && v.mapValue && typeof v.mapValue === 'object') {
    const fields = (v.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields || {};
    const out: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(fields)) {
      out[k] = decodeValue(fv);
    }
    return out;
  }
  return undefined;
}

export function decodeDocumentFields(
  fields: Record<string, Record<string, unknown>> | undefined
): Record<string, unknown> {
  if (!fields) return {};
  const out: Record<string, unknown> = {};
  for (const [k, fv] of Object.entries(fields)) {
    out[k] = decodeValue(fv);
  }
  return out;
}

export async function fsGetDocument(
  env: CfEnv,
  docPath: string
): Promise<Record<string, unknown> | null> {
  const url = `${baseUrl(env.FIREBASE_PROJECT_ID)}/${docPath}`;
  const res = await fetch(url, { headers: await authHeader(env) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore get ${docPath}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { fields?: Record<string, Record<string, unknown>> };
  return decodeDocumentFields(json.fields);
}

export async function fsCreateDocument(
  env: CfEnv,
  collection: string,
  fields: Record<string, unknown>
): Promise<string> {
  const url = `${baseUrl(env.FIREBASE_PROJECT_ID)}/${collection}`;
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, encodeValue(v)])) };
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...(await authHeader(env)), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore create ${collection}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { name?: string };
  const name = json.name || '';
  const id = name.split('/').pop() || '';
  return id;
}

export async function fsPatchDocument(
  env: CfEnv,
  docPath: string,
  fields: Record<string, unknown>,
  fieldPaths: string[]
): Promise<void> {
  const mask = fieldPaths.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const url = `${baseUrl(env.FIREBASE_PROJECT_ID)}/${docPath}?${mask}`;
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, encodeValue(v)])) };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...(await authHeader(env)), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore patch ${docPath}: ${res.status} ${await res.text()}`);
}

export async function fsRunQuery(env: CfEnv, structuredQuery: Record<string, unknown>): Promise<unknown[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
  const parent = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...(await authHeader(env)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent, structuredQuery }),
  });
  if (!res.ok) throw new Error(`Firestore runQuery: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as Array<{ document?: { fields?: Record<string, Record<string, unknown>> } }>;
  return rows
    .filter((r) => r.document?.fields)
    .map((r) => decodeDocumentFields(r.document!.fields!));
}
