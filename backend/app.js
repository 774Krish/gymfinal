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

// Serve static assets (frontend.js). On Vercel these are served by the CDN
// instead; this static middleware only matters for local development.
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Clean-URL page routes (no .html suffix)
const VIEWS = path.join(__dirname, '../views');
app.get('/login',         (req, res) => res.sendFile(path.join(VIEWS, 'login.html')));
app.get('/gym-select',    (req, res) => res.sendFile(path.join(VIEWS, 'gym-select.html')));
app.get('/verify-email',  (req, res) => res.sendFile(path.join(VIEWS, 'verify-email.html')));
app.get('/reset-password',(req, res) => res.sendFile(path.join(VIEWS, 'reset-password.html')));
app.get('/',              (req, res) => res.sendFile(path.join(VIEWS, 'index.html')));

// Redirect legacy .html URLs to their clean equivalents (preserve query string)
const legacyRedirects = {
  '/index.html': '/',
  '/login.html': '/login',
  '/gym-select.html': '/gym-select',
  '/verify-email.html': '/verify-email',
  '/reset-password.html': '/reset-password'
};
app.get(Object.keys(legacyRedirects), (req, res) => {
  const target = legacyRedirects[req.path];
  const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  res.redirect(301, target + qs);
});

// 404 handler — non-API paths fall back to the SPA shell
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(VIEWS, 'index.html'));
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
