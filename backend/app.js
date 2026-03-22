const path = require('path');
// Works no matter which working directory Node was started from (pairs with repo-root server.js).
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const emailRoutes = require('./routes/email');
const integrationsRoutes = require('./routes/integrations');

const app = express();

const DEFAULT_CORS_ORIGINS = [
  'https://bakesbyolayide.co.uk',
  'https://www.bakesbyolayide.co.uk',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

function buildCorsOriginList() {
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_CORS_ORIGINS, ...extra])];
}

const corsAllowedOrigins = buildCorsOriginList();

function httpRequestLogEnabled() {
  const v = (process.env.HTTP_LOG || '').toLowerCase().trim();
  if (v === '0' || v === 'false' || v === 'off') return false;
  if (v === '1' || v === 'true' || v === 'on') return true;
  return process.env.NODE_ENV === 'production';
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsAllowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

if (httpRequestLogEnabled()) {
  app.use((req, res, next) => {
    const start = Date.now();
    const pathOnly = String(req.originalUrl || req.url || '').split('?')[0];
    if (!pathOnly.startsWith('/api')) return next();
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(`[http] ${req.method} ${pathOnly} ${res.statusCode} ${ms}ms`);
    });
    next();
  });
}

// API routes (register before static + SPA fallback)
app.use('/api', emailRoutes);
app.use('/api', integrationsRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

const buildDir = path.join(__dirname, '../build');
const indexHtmlPath = path.join(buildDir, 'index.html');

// Serve built React assets (JS/CSS, /static, etc.)
app.use(express.static(buildDir));

// SPA: React Router paths (/collections, /home, …) are not files on disk — serve index.html
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api')) return next();
  if (!fs.existsSync(indexHtmlPath)) return next();
  res.sendFile(indexHtmlPath);
});

// Log server-side failures that no route handled (does not run for 404 on API — add 404 handler if needed)
app.use((err, req, res, next) => {
  console.error('[express]', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(err.status && Number.isFinite(err.status) ? err.status : 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : String(err.message || err),
  });
});

module.exports = app; 