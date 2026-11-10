const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config();

// Use Turso (libSQL) when TURSO_DATABASE_URL is set; otherwise fall back to a
// local SQLite file so local dev works with zero cloud setup.
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const client = createClient({
  url: TURSO_URL || `file:${path.join(__dirname, 'renewal-radar.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

if (TURSO_URL) {
  console.log('DB: using Turso (persistent)');
} else {
  console.log('DB: WARNING — using local file fallback (NOT persistent on serverless platforms like Vercel)');
}

// Backwards-compatible export name (kept in case other modules import `db`).
const db = client;

// Initialize database schema
async function initializeDB() {
  // Enable foreign keys for local file DBs (Turso enforces them by default).
  try { await client.execute('PRAGMA foreign_keys = ON'); } catch (_) { /* ignored on Turso */ }

  const schema = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT,
      emailVerified BOOLEAN DEFAULT 0,
      verificationToken TEXT,
      verificationTokenExpiry DATETIME,
      resetToken TEXT,
      resetTokenExpiry DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS gyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ownerId INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gymId INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      plan TEXT,
      startDate DATE,
      renewalDate DATE,
      lastRenewalDate DATE,
      status TEXT DEFAULT 'active',
      ptSessions INTEGER DEFAULT 0,
      ptSessionsRemaining INTEGER DEFAULT 0,
      notes TEXT,
      flagged INTEGER DEFAULT 0,
      lastRemindedDate DATE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(gymId) REFERENCES gyms(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS user_gyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      gymId INTEGER NOT NULL,
      role TEXT DEFAULT 'owner',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, gymId),
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(gymId) REFERENCES gyms(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gymId INTEGER NOT NULL,
      memberId INTEGER,
      action TEXT,
      details TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(gymId) REFERENCES gyms(id) ON DELETE CASCADE,
      FOREIGN KEY(memberId) REFERENCES members(id) ON DELETE SET NULL
    )`
  ];

  for (const sql of schema) {
    await client.execute(sql);
  }
}

// Add columns that may be missing on databases created before a feature was added
async function migrateUsersTable() {
  const cols = await dbAll('PRAGMA table_info(users)');
  const names = cols.map(c => c.name);
  const missing = [
    { name: 'resetToken', ddl: 'resetToken TEXT' },
    { name: 'resetTokenExpiry', ddl: 'resetTokenExpiry DATETIME' }
  ].filter(c => !names.includes(c.name));

  for (const col of missing) {
    await dbRun(`ALTER TABLE users ADD COLUMN ${col.ddl}`);
  }
}

// Add columns added later to the members table (flagged, lastRemindedDate)
async function migrateMembersTable() {
  const cols = await dbAll('PRAGMA table_info(members)');
  const names = cols.map(c => c.name);
  const missing = [
    { name: 'flagged', ddl: 'flagged INTEGER DEFAULT 0' },
    { name: 'lastRemindedDate', ddl: 'lastRemindedDate DATE' }
  ].filter(c => !names.includes(c.name));

  for (const col of missing) {
    await dbRun(`ALTER TABLE members ADD COLUMN ${col.ddl}`);
  }
}

// Helper functions to run queries against libSQL/Turso.
// dbRun returns a sqlite3-like object (lastID, changes) for compatibility.
async function dbRun(sql, params = []) {
  const result = await client.execute({ sql, args: params });
  return {
    lastID: Number(result.lastInsertRowid ?? 0),
    changes: Number(result.rowsAffected ?? 0),
    result
  };
}

async function dbGet(sql, params = []) {
  const result = await client.execute({ sql, args: params });
  return result.rows[0] ?? null;
}

async function dbAll(sql, params = []) {
  const result = await client.execute({ sql, args: params });
  return result.rows ?? [];
}

module.exports = {
  db,
  initializeDB,
  migrateUsersTable,
  migrateMembersTable,
  dbRun,
  dbGet,
  dbAll
};
