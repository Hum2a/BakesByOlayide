require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const emailRoutes = require('./routes/email');
const integrationsRoutes = require('./routes/integrations');

const app = express();

app.use(cors({
  origin: [
    'https://bakesbyolayide.co.uk',
    'http://localhost:3000'
  ],
  credentials: true
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