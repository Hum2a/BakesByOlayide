require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const emailRoutes = require('./routes/email');

const app = express();

app.use(cors({
  origin: [
    'https://bakesbyolayide.co.uk',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// API routes
app.use('/api', emailRoutes);

// Serve static files (React build)
app.use(express.static(path.join(__dirname, '../build')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

module.exports = app; 