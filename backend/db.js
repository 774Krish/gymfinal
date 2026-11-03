const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './renewal-radar.db';
const db = new sqlite3.Database(DB_PATH);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database schema
function initializeDB() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
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
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Gyms table
      db.run(`
        CREATE TABLE IF NOT EXISTS gyms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ownerId INTEGER NOT NULL,
          name TEXT NOT NULL,
          location TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Members table
      db.run(`
        CREATE TABLE IF NOT EXISTS members (
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
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(gymId) REFERENCES gyms(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
      });

      // User Gyms Relationship (for multiple gym access if needed later)
      db.run(`
        CREATE TABLE IF NOT EXISTS user_gyms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          gymId INTEGER NOT NULL,
          role TEXT DEFAULT 'owner',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(userId, gymId),
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY(gymId) REFERENCES gyms(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Activity log table for audit trail
      db.run(`
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          gymId INTEGER NOT NULL,
          memberId INTEGER,
          action TEXT,
          details TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(gymId) REFERENCES gyms(id) ON DELETE CASCADE,
          FOREIGN KEY(memberId) REFERENCES members(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
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

// Helper functions to promisify database operations
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = {
  db,
  initializeDB,
  migrateUsersTable,
  dbRun,
  dbGet,
  dbAll
};
