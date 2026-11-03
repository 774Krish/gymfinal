const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDB, migrateUsersTable } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend if they exist
app.use(express.static(path.join(__dirname, '../')));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 404 handler
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initializeDB()
  .then(() => migrateUsersTable())
  .then(() => {
    console.log('Database initialized');
    app.listen(PORT, () => {
      console.log(`
╭────────────────────────────────────╮
│  Renewal Radar Backend             │
│  Server running on port ${PORT}       │
│  Environment: ${process.env.NODE_ENV}       │
╰────────────────────────────────────╯
      `);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;
