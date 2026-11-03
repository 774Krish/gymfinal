# Email Verification System Implementation Guide

## Overview
Your system has the foundation for email verification in place. Here's what's already implemented and what needs to be added:

### ✅ Already Implemented:
- ✅ **Database**: Stores `verificationToken`, `verificationTokenExpiry`, `emailVerified` in users table
- ✅ **Backend Logic**: 
  - `generateVerificationToken()` - creates 64-char random token
  - `getVerificationTokenExpiry()` - sets 24-hour expiry
  - `verifyEmail()` endpoint - validates token and marks email as verified
  - Login blocks unverified emails
- ✅ **Frontend**: `verify-email.html` page for token input

### ❌ Missing:
- ❌ **Email Service**: No code to actually SEND emails yet

---

## Step-by-Step Implementation

### Step 1: Install Email Service Package
Add Nodemailer to your dependencies (for sending emails):

```bash
npm install nodemailer
```

### Step 2: Create Email Service Module
Create a new file `backend/email.js`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure your email service
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

// Send verification email
async function sendVerificationEmail(email, verificationToken, firstName = 'User') {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email.html?token=${verificationToken}`;
  
  const htmlTemplate = `
    <h2>Welcome to Renewal Radar, ${firstName}!</h2>
    <p>Thank you for signing up. Please verify your email address to activate your account.</p>
    <p>
      <a href="${verificationLink}" 
         style="display: inline-block; padding: 12px 24px; background-color: #5b9dff; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Verify Email
      </a>
    </p>
    <p>Or copy and paste this link in your browser:</p>
    <p>${verificationLink}</p>
    <p><strong>This link expires in 24 hours.</strong></p>
    <hr>
    <p>If you didn't sign up for Renewal Radar, please ignore this email.</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Renewal Radar Email',
      html: htmlTemplate,
      text: `Welcome to Renewal Radar! Verify your email: ${verificationLink}`
    });
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { sendVerificationEmail };
```

### Step 3: Update .env File
Add these variables to your `.env` file in the backend folder:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@renewalradar.com
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
```

**For Gmail:**
- Enable 2-Factor Authentication
- Generate an [App Password](https://myaccount.google.com/apppasswords)
- Use that 16-character password in `EMAIL_PASSWORD`

### Step 4: Integrate Email Service into Signup
Update `backend/auth.js` to send verification email after signup:

```javascript
// At the top of auth.js, add:
const { sendVerificationEmail } = require('./email');

// Then modify the signup function - after user creation, add this:
async function signup(email, password, firstName, lastName) {
  // ... existing validation code ...

  try {
    // ... existing code to create user ...
    
    // SEND VERIFICATION EMAIL
    await sendVerificationEmail(email, verificationToken, firstName);

    return {
      success: true,
      needsVerification: true,
      verificationToken, // optional: for development/testing only
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
```

### Step 5: Update Frontend - Signup Page
Your signup page should redirect to verification page after signup:

```javascript
// In your signup form submit handler (in login.html or signup endpoint):

async function handleSignup(email, password, firstName, lastName) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName })
  });

  const data = await response.json();
  
  if (data.success) {
    // Redirect to verification page
    localStorage.setItem('verificationEmail', email);
    window.location.href = '/verify-email.html';
  } else {
    alert('Signup error: ' + data.error);
  }
}
```

### Step 6: Update Verification Page
Update `verify-email.html` to handle token from URL parameter:

```javascript
// Add this script to verify-email.html:
<script>
async function verifyTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  if (!token) {
    document.getElementById('tokenInput').focus();
    return;
  }

  // Auto-submit if token in URL
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.token);
    alert('Email verified! Redirecting to login...');
    window.location.href = '/login.html';
  } else {
    alert('Verification failed: ' + data.error);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', verifyTokenFromURL);
</script>
```

---

## Complete User Flow

```
1. User signs up (login.html)
   ↓
2. Frontend sends POST /auth/signup
   ↓
3. Backend creates user with verification token
   ↓
4. Email service sends verification email with link
   ↓
5. User receives email with link: /verify-email.html?token=ABC123...
   ↓
6. User clicks link (or manually enters token)
   ↓
7. Frontend sends POST /auth/verify-email with token
   ↓
8. Backend validates token and marks email as verified
   ↓
9. Backend returns JWT token
   ↓
10. Frontend stores token and redirects to login/dashboard
```

---

## Testing Without Real Email

### Option A: Use Mailtrap
```javascript
// Use Mailtrap for free email testing
const transporter = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASSWORD
  }
});
```
[Sign up at Mailtrap.io](https://mailtrap.io)

### Option B: Log to Console (Development Only)
```javascript
async function sendVerificationEmail(email, verificationToken, firstName = 'User') {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n✉️  VERIFICATION EMAIL (DEV MODE)\nTo: ${email}\nToken: ${verificationToken}\n`);
    return { success: true };
  }
  // ... real email sending code ...
}
```

---

## Security Notes

✅ **Already Good:**
- Tokens are random (64 chars, cryptographically unpredictable)
- Tokens expire after 24 hours
- Password hashing with bcryptjs

⚠️ **Consider Adding:**
- Rate limiting on signup/verification endpoints
- HTTPS only in production
- Resend verification email option (if user didn't receive)

---

## Verification Endpoint Summary

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/auth/signup` | POST | `{email, password, firstName, lastName}` | User + verification needed |
| `/api/auth/verify-email` | POST | `{token}` | JWT token + verified user |
| `/api/auth/login` | POST | `{email, password}` | JWT token (blocks if unverified) |

