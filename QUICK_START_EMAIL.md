# 🚀 Email Verification - Quick Start (3 Steps)

## What's Ready ✅

Your gym app now has **complete email verification** built in. Here's what was added:

- ✅ Email sending service (`backend/email.js`)
- ✅ Automatic email on signup
- ✅ Verification flow integrated
- ✅ Login blocks unverified users
- ✅ Database fields set up
- ✅ Frontend verification page ready

---

## 3 Steps to Enable

### Step 1: Create `.env` File

Go to `backend/` folder and create a file named `.env`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-123456
DB_PATH=./renewal-radar.db

# Email Settings - Choose ONE option below

# OPTION A: Gmail (Free)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@renewalradar.com

# OPTION B: Mailtrap (Free, Best for Testing)
# EMAIL_HOST=live.smtp.mailtrap.io
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your-mailtrap-username
# EMAIL_PASSWORD=your-mailtrap-password
# EMAIL_FROM=noreply@renewalradar.com

FRONTEND_URL=http://localhost:3000
```

### Step 2: Get Email Credentials

**Gmail Setup (5 min):**
1. Go to [Google Account](https://myaccount.google.com)
2. Security → App Passwords (skip if 2FA not enabled, enable it first)
3. Select "Mail" and "Windows Computer"
4. Copy the 16-char password
5. Paste into `.env` as `EMAIL_PASSWORD`

**OR Mailtrap Setup (2 min):**
1. Go to [Mailtrap.io](https://mailtrap.io) - sign up free
2. Create project
3. Copy SMTP credentials
4. Paste into `.env`
5. All test emails go to Mailtrap inbox - perfect for testing!

### Step 3: Restart Server

```bash
# Server is already running, but restart to load .env:
# Press Ctrl+C to stop, then:
npm start
```

---

## Test It! 🧪

### Method A: Web Form (Easiest)
1. Open http://localhost:3000/login.html
2. Click "Sign Up"
3. Fill email, password, name
4. Click "Sign Up"
5. **Check your email inbox** for verification link
6. Click the link
7. **✅ Verified!** Can now login

### Method B: API (Postman/Terminal)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "password123",
    "firstName": "Your Name"
  }'
```

Then check your email for the verification link.

---

## Complete User Flow Diagram

```
User Signup Form
    ↓
    └─→ Frontend sends email + password + name
        ↓
    Backend validates & creates user
        ↓
    🚀 EMAIL SENT automatically!
        ├─→ Email Service (Gmail/Mailtrap)
        │   ↓
        │   User receives: "Verify Your Email"
        │   │
        │   └─→ User clicks link
        │       ↓
        │   Verification Link: /verify-email.html?token=ABC123...
        │       ↓
        │   Backend validates token ✅
        │       ↓
        │   User marked: emailVerified = true
        │       ↓
        │   JWT token issued 🎫
        │
        └─→ User can now LOGIN ✅
            └─→ Login endpoint checks emailVerified
                └─→ Success!
```

---

## What Each File Does

| File | Purpose |
|------|---------|
| `backend/email.js` | **NEW** - Sends verification emails |
| `backend/auth.js` | **MODIFIED** - Calls email service on signup |
| `backend/.env.example` | **NEW** - Shows required environment variables |
| `verify-email.html` | **READY** - Frontend verification page (no changes needed) |
| `backend/routes.js` | **READY** - Has `/auth/verify-email` endpoint |

---

## Security Notes ✅

- **Tokens**: Random 64-character, unguessable
- **Expiry**: Automatically expire after 24 hours
- **Passwords**: Hashed with bcryptjs
- **Database**: Stores encrypted, can't login without verification
- **HTTPS**: Add to production (don't send via HTTP!)

---

## Testing Without Real Email (Development)

If you want to test without sending real emails:

### Option 1: Mailtrap (Recommended)
- Sign up free at [Mailtrap.io](https://mailtrap.io)
- All emails go to fake inbox
- Perfect for testing

### Option 2: Console Output (Dev Mode)
Edit `backend/email.js`, wrap sending in check:
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log(`Email would be sent to ${email}`);
  console.log(`Token: ${verificationToken}`);
  return { success: true };
}
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "EAUTH: Invalid login" | Check email/password in `.env` (Gmail: use App Password) |
| "Module not found: email" | Already fixed - nodemailer installed ✅ |
| "Email not received" | Check spam/promotions folder |
| "No .env file" | Create `backend/.env` with email settings |
| Server won't start | Make sure port 5000 is not in use |

---

## Next Steps (Optional)

After testing signup/verification, you might want to add:

- [ ] "Resend verification email" button
- [ ] Password reset via email
- [ ] Email change verification
- [ ] Login notifications
- [ ] Profile email updates

See `EMAIL_VERIFICATION_GUIDE.md` for advanced features.

---

## Files Created/Modified

```
✅ NEW FILES:
   backend/email.js
   backend/.env.example
   SETUP_EMAIL.md
   EMAIL_VERIFICATION_GUIDE.md
   EMAIL_IMPLEMENTATION_SUMMARY.md
   QUICK_START_EMAIL.md (this file)

✏️  MODIFIED FILES:
   backend/auth.js (added email sending)
   backend/package.json (added nodemailer)

🔄 ALREADY WORKING:
   verify-email.html
   backend/routes.js
   backend/db.js
```

---

## Status

✅ **Implementation Complete**

Next: Add email credentials to `.env` and restart server.

Questions? See the detailed docs:
- `SETUP_EMAIL.md` - Email provider setup
- `EMAIL_VERIFICATION_GUIDE.md` - Technical details
- `EMAIL_IMPLEMENTATION_SUMMARY.md` - Full overview

Happy testing! 🎉
