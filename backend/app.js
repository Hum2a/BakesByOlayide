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

app.use(cors({
  origin: [
    'https://bakesbyolayide.co.uk',
    'https://www.bakesbyolayide.co.uk',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

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

module.exports = app; 