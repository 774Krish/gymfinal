const bcrypt = require('bcryptjs');
const { dbGet, dbRun } = require('./db');

// Demo account — pre-verified so anyone can log in without checking email.
// Override via env vars if needed.
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@renewalradar.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo12345';

async function seedDemoUser() {
  const existing = await dbGet('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);
  if (existing) {
    console.log(`Demo user already exists: ${DEMO_EMAIL}`);
    return;
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await dbRun(
    `INSERT INTO users (email, password, firstName, lastName, emailVerified)
     VALUES (?, ?, ?, ?, 1)`,
    [DEMO_EMAIL, hash, 'Demo', 'User']
  );

  console.log(`Demo user created (verified): ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

module.exports = { seedDemoUser };
