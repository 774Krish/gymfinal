const express = require('express');
const { dbRun, dbGet, dbAll } = require('./db');
const { authMiddleware, signup, login, verifyEmail, forgotPassword, resetPassword } = require('./auth');

const router = express.Router();

// ============ AUTHENTICATION ============

// Sign up
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await signup(email, password, firstName, lastName);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify email
router.post('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const result = await verifyEmail(token);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await login(email, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot password - send reset link
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await forgotPassword(email);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password using token
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const result = await resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, email, firstName, lastName FROM users WHERE id = ?', [req.userId]);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete current user's account (and all their data)
router.delete('/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Explicitly clean up related rows so it works even if FK cascades are off.
    const gyms = await dbAll('SELECT id FROM gyms WHERE ownerId = ?', [userId]);
    const gymIds = gyms.map(g => g.id);

    if (gymIds.length > 0) {
      const placeholders = gymIds.map(() => '?').join(', ');
      await dbRun(`DELETE FROM members WHERE gymId IN (${placeholders})`, gymIds);
      await dbRun(`DELETE FROM activity_log WHERE gymId IN (${placeholders})`, gymIds);
      await dbRun(`DELETE FROM user_gyms WHERE gymId IN (${placeholders})`, gymIds);
      await dbRun('DELETE FROM gyms WHERE ownerId = ?', [userId]);
    }

    await dbRun('DELETE FROM user_gyms WHERE userId = ?', [userId]);
    await dbRun('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ GYMS ============

// Create gym
router.post('/gyms', authMiddleware, async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Gym name required' });
    }

    const result = await dbRun(
      'INSERT INTO gyms (ownerId, name, location) VALUES (?, ?, ?)',
      [req.userId, name, location || '']
    );

    // Add to user_gyms table
    await dbRun(
      'INSERT INTO user_gyms (userId, gymId, role) VALUES (?, ?, ?)',
      [req.userId, result.lastID, 'owner']
    );

    const gym = await dbGet('SELECT * FROM gyms WHERE id = ?', [result.lastID]);
    res.status(201).json(gym);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's gyms
router.get('/gyms', authMiddleware, async (req, res) => {
  try {
    const gyms = await dbAll(
      'SELECT g.* FROM gyms g JOIN user_gyms ug ON g.id = ug.gymId WHERE ug.userId = ? ORDER BY g.createdAt DESC',
      [req.userId]
    );
    res.json(gyms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get gym details
router.get('/gyms/:gymId', authMiddleware, async (req, res) => {
  try {
    const { gymId } = req.params;

    // Verify user has access to this gym
    const access = await dbGet(
      'SELECT * FROM user_gyms WHERE userId = ? AND gymId = ?',
      [req.userId, gymId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const gym = await dbGet('SELECT * FROM gyms WHERE id = ?', [gymId]);
    res.json(gym);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update gym
router.put('/gyms/:gymId', authMiddleware, async (req, res) => {
  try {
    const { gymId } = req.params;
    const { name, location } = req.body;

    // Verify user owns this gym
    const gym = await dbGet(
      'SELECT g.* FROM gyms g JOIN user_gyms ug ON g.id = ug.gymId WHERE g.id = ? AND ug.userId = ? AND ug.role = ?',
      [gymId, req.userId, 'owner']
    );

    if (!gym) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await dbRun(
      'UPDATE gyms SET name = ?, location = ? WHERE id = ?',
      [name || gym.name, location !== undefined ? location : gym.location, gymId]
    );

    const updated = await dbGet('SELECT * FROM gyms WHERE id = ?', [gymId]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MEMBERS ============

// Add member to gym
router.post('/gyms/:gymId/members', authMiddleware, async (req, res) => {
  try {
    const { gymId } = req.params;
    const { name, phone, email, plan, startDate, renewalDate, ptSessions, notes } = req.body;

    // Verify access
    const access = await dbGet(
      'SELECT * FROM user_gyms WHERE userId = ? AND gymId = ?',
      [req.userId, gymId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Member name required' });
    }

    const result = await dbRun(
      `INSERT INTO members (gymId, name, phone, email, plan, startDate, renewalDate, ptSessions, ptSessionsRemaining, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [gymId, name, phone || '', email || '', plan || '', startDate || null, renewalDate || null, ptSessions || 0, ptSessions || 0, notes || '']
    );

    await dbRun(
      'INSERT INTO activity_log (gymId, memberId, action, details) VALUES (?, ?, ?, ?)',
      [gymId, result.lastID, 'member_added', `Added member: ${name}`]
    );

    const member = await dbGet('SELECT * FROM members WHERE id = ?', [result.lastID]);
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get gym members
router.get('/gyms/:gymId/members', authMiddleware, async (req, res) => {
  try {
    const { gymId } = req.params;

    // Verify access
    const access = await dbGet(
      'SELECT * FROM user_gyms WHERE userId = ? AND gymId = ?',
      [req.userId, gymId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await dbAll(
      'SELECT * FROM members WHERE gymId = ? ORDER BY renewalDate ASC',
      [gymId]
    );

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get member details
router.get('/gyms/:gymId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { gymId, memberId } = req.params;

    // Verify access
    const access = await dbGet(
      'SELECT * FROM user_gyms WHERE userId = ? AND gymId = ?',
      [req.userId, gymId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const member = await dbGet(
      'SELECT * FROM members WHERE id = ? AND gymId = ?',
      [memberId, gymId]
    );

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update member
router.put('/gyms/:gymId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { gymId, memberId } = req.params;
    const updates = req.body;

    // Verify access
    const access = await dbGet(
      'SELECT * FROM user_gyms WHERE userId = ? AND gymId = ?',
      [req.userId, gymId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const member = await dbGet(
      'SELECT * FROM members WHERE id = ? AND gymId = ?',
      [memberId, gymId]
    );

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Build update query dynamically
    const fields = ['name', 'phone', 'email', 'plan', 'startDate', 'renewalDate', 'lastRenewalDate', 'status', 'ptSessions', 'ptSessionsRemaining', 'notes'];
    const updateParts = [];
    const params = [];

    fields.forEach(field => {
      if (field in updates) {
        updateParts.push(`${field} = ?`);
        params.push(updates[field]);
      }
    });

    if (updateParts.length > 0) {
      updateParts.push('updatedAt = CURRENT_TIMESTAMP');
      params.push(memberId, gymId);

      await dbRun(
        `UPDATE members SET ${updateParts.join(', ')} WHERE id = ? AND gymId = ?`,
        params
      );

      await dbRun(
        'INSERT INTO activity_log (gymId, memberId, action, details) VALUES (?, ?, ?, ?)',
        [gymId, memberId, 'member_updated', JSON.stringify(updates)]
      );
    }

    const updated = await dbGet('SELECT * FROM members WHERE id = ?', [memberId]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete member
router.delete('/gyms/:gymId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { gymId, memberId } = req.params;

    // Verify access
    const access = await dbGet(
      'SELECT * FROM user_gyms WHERE userId = ? AND gymId = ?',
      [req.userId, gymId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const member = await dbGet(
      'SELECT * FROM members WHERE id = ? AND gymId = ?',
      [memberId, gymId]
    );

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await dbRun('DELETE FROM members WHERE id = ?', [memberId]);

    await dbRun(
      'INSERT INTO activity_log (gymId, memberId, action, details) VALUES (?, ?, ?, ?)',
      [gymId, memberId, 'member_deleted', `Deleted member: ${member.name}`]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export all members data for a gym (for backup/import)
router.get('/gyms/:gymId/export', authMiddleware, async (req, res) => {
  try {
    const { gymId } = req.params;

    // Verify access
    const access = await dbGet(
      'SELECT * FROM user_gyms WHERE userId = ? AND gymId = ?',
      [req.userId, gymId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const gym = await dbGet('SELECT * FROM gyms WHERE id = ?', [gymId]);
    const members = await dbAll('SELECT * FROM members WHERE gymId = ? ORDER BY name ASC', [gymId]);

    res.json({ gym, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
