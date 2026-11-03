const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('./db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./email');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '7d';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate email format
function isValidEmail(email) {
  return EMAIL_REGEX.test(email) && email.length <= 255;
}

// Generate verification token
function generateVerificationToken() {
  return Math.random().toString(36).substr(2, 32) + Math.random().toString(36).substr(2, 32);
}

// Generate token expiry (24 hours from now)
function getVerificationTokenExpiry() {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now.toISOString();
}

// Generate reset token expiry (1 hour from now, SQLite datetime-compatible)
function getResetTokenExpiry() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Hash password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Compare password
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Create JWT token
function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Middleware to verify auth token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.userId;
  next();
}

// Sign up
async function signup(email, password, firstName, lastName) {
  try {
    // Validate email format
    if (!email || !isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (existing) {
      throw new Error('This email is already registered');
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Validate name
    if (!firstName || firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getVerificationTokenExpiry();

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const result = await dbRun(
      `INSERT INTO users (email, password, firstName, lastName, verificationToken, verificationTokenExpiry, emailVerified) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [normalizedEmail, hashedPassword, firstName.trim(), lastName ? lastName.trim() : '', verificationToken, verificationTokenExpiry, 0]
    );

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken, firstName.trim());

    return {
      success: true,
      needsVerification: true,
      userId: result.lastID,
      email: normalizedEmail,
      message: 'Account created! Check your email for verification link.',
      user: {
        id: result.lastID,
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : '',
        emailVerified: false
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Verify email
async function verifyEmail(verificationToken) {
  try {
    const user = await dbGet(
      'SELECT * FROM users WHERE verificationToken = ? AND verificationTokenExpiry > datetime("now")',
      [verificationToken]
    );

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified
    await dbRun(
      'UPDATE users SET emailVerified = 1, verificationToken = NULL, verificationTokenExpiry = NULL WHERE id = ?',
      [user.id]
    );

    const token = createToken(user.id);
    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Login
async function login(email, password) {
  try {
    if (!email || !isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    
    if (!user) {
      throw new Error('Email or password is incorrect');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in. Check your email for the verification link.');
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email or password is incorrect');
    }

    const token = createToken(user.id);
    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Forgot password - generate reset token and email a reset link
async function forgotPassword(email) {
  try {
    if (!email || !isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

    // Always return success to avoid leaking which emails are registered
    if (!user) {
      return { success: true, message: 'If that email is registered, a reset link has been sent.' };
    }

    const resetToken = generateVerificationToken();
    const resetTokenExpiry = getResetTokenExpiry();

    await dbRun(
      'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id]
    );

    await sendPasswordResetEmail(normalizedEmail, resetToken);

    return {
      success: true,
      message: 'If that email is registered, a reset link has been sent.'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Reset password using token
async function resetPassword(token, newPassword) {
  try {
    if (!token) {
      throw new Error('Reset token is required');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const user = await dbGet(
      'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > datetime("now")',
      [token]
    );

    if (!user) {
      throw new Error('Invalid or expired reset link. Please request a new one.');
    }

    const hashedPassword = await hashPassword(newPassword);

    await dbRun(
      'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    return {
      success: true,
      message: 'Password reset successfully. You can now sign in.'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  authMiddleware,
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  isValidEmail,
  generateVerificationToken
};
