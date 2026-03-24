#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

function loadEnvFiles() {
  const root = process.cwd();
  const envPaths = [path.join(root, '.env'), path.join(root, 'backend', '.env')];
  envPaths.forEach((p) => {
    if (fs.existsSync(p)) dotenv.config({ path: p, override: false });
  });
}

function getArg(name, fallback) {
  const pref = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pref));
  if (!hit) return fallback;
  return hit.slice(pref.length);
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function parseIntArg(name, fallback) {
  const raw = getArg(name, String(fallback));
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function normalizePrivateKey(raw) {
  if (!raw) return '';
  return String(raw).replace(/\\n/g, '\n');
}

function ensureFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!admin.apps.length) {
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId || undefined,
      });
    }
  }
  return admin.firestore();
}

function typeName(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (value && typeof value === 'object') {
    if (typeof value.toDate === 'function' && typeof value.seconds === 'number') return 'timestamp';
    return 'map';
  }
  return typeof value;
}

function inferShape(value, depth, maxShapeDepth) {
  const t = typeName(value);
  if (depth >= maxShapeDepth) return { type: t };
  if (t === 'array') {
    const arr = value;
    const sample = arr.slice(0, 5).map((v) => inferShape(v, depth + 1, maxShapeDepth));
    return { type: 'array', sampleItemShapes: sample };
  }
  if (t === 'map') {
    const out = {};
    Object.entries(value)
      .slice(0, 50)
      .forEach(([k, v]) => {
        out[k] = inferShape(v, depth + 1, maxShapeDepth);
      });
    return { type: 'map', fields: out };
  }
  return { type: t };
}

function mergeTypeMap(target, field, t) {
  if (!target[field]) target[field] = {};
  target[field][t] = (target[field][t] || 0) + 1;
}

async function analyzeCollection(colRef, options, level) {
  const snap = await colRef.limit(options.sampleDocsPerCollection).get();
  const docSamples = [];
  const fieldTypes = {};
  const subcollections = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const sampleShape = {};

    Object.entries(data).forEach(([k, v]) => {
      const t = typeName(v);
      mergeTypeMap(fieldTypes, k, t);
      sampleShape[k] = inferShape(v, 0, options.maxShapeDepth);
    });

    docSamples.push({
      id: doc.id,
      fieldCount: Object.keys(data).length,
      shape: sampleShape,
    });

    if (level < options.maxDepth) {
      const childCols = await doc.ref.listCollections();
      for (const child of childCols) {
        subcollections.push(await analyzeCollection(child, options, level + 1));
      }
    }
  }

  return {
    path: colRef.path,
    id: colRef.id,
    sampleDocCount: snap.size,
    sampledFields: fieldTypes,
    sampledDocs: docSamples,
    subcollections,
  };
}

function printHelp() {
  console.log(`
Dump Firestore collection schema by sampling docs and recursing subcollections.

Usage:
  node scripts/dump-firestore-schema.js [--output=firestore-schema.snapshot.json] [--sample=20] [--depth=3] [--shapeDepth=2]

Options:
  --output=<path>      Output JSON file path (default: firestore-schema.snapshot.json)
  --sample=<number>    Max docs sampled per collection (default: 20)
  --depth=<number>     Max subcollection recursion depth (default: 3)
  --shapeDepth=<num>   Max nested map/array shape depth (default: 2)
  --help               Show this help

Env:
  Uses FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY if present.
  Also auto-loads .env and backend/.env from repo root.
`);
}

async function main() {
  if (hasFlag('help')) {
    printHelp();
    process.exit(0);
  }

  loadEnvFiles();
  const db = ensureFirebase();

  const options = {
    sampleDocsPerCollection: parseIntArg('sample', 20),
    maxDepth: parseIntArg('depth', 3),
    maxShapeDepth: parseIntArg('shapeDepth', 2),
  };
  const output = getArg('output', 'firestore-schema.snapshot.json');

  const rootCollections = await db.listCollections();
  const analyzed = [];
  for (const col of rootCollections) {
    analyzed.push(await analyzeCollection(col, options, 0));
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    projectId: process.env.FIREBASE_PROJECT_ID || (admin.app().options && admin.app().options.projectId) || null,
    options,
    rootCollections: analyzed,
  };

  const outPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Firestore schema snapshot written: ${outPath}`);
  console.log(`Root collections analyzed: ${analyzed.length}`);
}

main().catch((err) => {
  console.error('Failed to dump Firestore schema:', err && err.stack ? err.stack : err);
  process.exit(1);
});

