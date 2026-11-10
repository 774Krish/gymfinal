const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDB, migrateUsersTable } = require('./db');
const { seedDemoUser } = require('./seed');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lazy database init — runs once per warm instance.
// Vercel is serverless, so we can't rely on a startup hook; instead we
// initialise on the first request and cache the promise for the instance.
let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = initializeDB()
      .then(() => migrateUsersTable())
      .then(() => seedDemoUser())
      .catch(err => {
        readyPromise = null;
        throw err;
      });
  }
  return readyPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (err) {
    next(err);
  }
});

// Never serve backend internals or dotfiles (like .env) as static assets
app.use((req, res, next) => {
  const decoded = decodeURIComponent(req.path);
  const segments = decoded.split('/');
  if (decoded.startsWith('/backend') || segments.some(seg => seg.startsWith('.'))) {
    return res.status(404).send('Not found');
  }
  next();
});

// Serve static files from public/. On Vercel these are served by the CDN
// instead; this static middleware only matters for local development.
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Expose the ready promise so a local server can await init at boot.
app.ready = ensureReady;

module.exports = app;
