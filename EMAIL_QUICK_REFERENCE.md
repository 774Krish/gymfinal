# Email Verification - Quick Reference Card

## 📋 Setup Checklist

- [ ] Install: `npm install nodemailer` in `backend/`
- [ ] Create: `backend/.env` file
- [ ] Add: Email credentials from Gmail or Mailtrap
- [ ] Restart: `npm start`
- [ ] Test: Signup and check email

## 🔧 .env Template

```env
NODE_ENV=development
JWT_SECRET=change-me-to-random-string
FRONTEND_URL=http://localhost:3000

# Gmail Option
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=16-char-app-password

# OR Mailtrap Option (recommended for testing)
# EMAIL_HOST=live.smtp.mailtrap.io
# EMAIL_USER=username
# EMAIL_PASSWORD=password
```

## 📧 Email Flow

```
User Signs Up
    ↓ (email + password + name)
    ↓
Backend: Creates user + generates token
    ↓
Email Service: Sends verification email
    ↓
User: Clicks link in email
    ↓ (token=ABC123...)
    ↓
Backend: Validates token + marks verified
    ↓
User: Can now login ✅
```

## 🔌 API Endpoints

### Signup (Creates account + sends email)
```
POST /api/auth/signup
Body: {
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
Response: {
  "success": true,
  "message": "Account created! Check your email for verification link.",
  "userId": 1,
  "email": "user@example.com"
}
```

### Verify Email (Validates token)
```
POST /api/auth/verify-email
Body: {
  "token": "verification-token-from-email"
}
Response: {
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

### Login (Checks emailVerified = true)
```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "token": "jwt-token-here",
  "user": { ... }
}
```

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `backend/email.js` | Email sending service |
| `backend/auth.js` | Auth + integration |
| `backend/.env` | Email credentials (create yourself) |
| `verify-email.html` | Token input page |
| `backend/routes.js` | API endpoints |

## 🚀 Test Commands

### Test with curl
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","firstName":"John"}'
```

### Test with Postman
1. New request → POST
2. URL: `http://localhost:5000/api/auth/signup`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```
5. Send → Check email

## 🔐 Security

- Tokens: 64 chars, random, unguessable
- Expiry: 24 hours automatic
- Passwords: bcryptjs hashed
- Database: emailVerified prevents login
- Production: Use HTTPS + strong JWT_SECRET

## ⚡ Quick Fixes

| Problem | Solution |
|---------|----------|
| Email credentials error | Check `.env` (Gmail: use App Password, not regular password) |
| Email not sent | Check terminal logs, verify `.env` |
| Can't find email | Check spam/junk, then trash |
| Token expired | > 24 hours old, need to resend |
| Nodemailer missing | `npm install nodemailer` in backend/ |
| No .env file | Create `backend/.env` with example template |

## 📚 Documentation

- **Quick Start**: `QUICK_START_EMAIL.md`
- **Setup Guide**: `SETUP_EMAIL.md`
- **Full Docs**: `EMAIL_VERIFICATION_GUIDE.md`
- **Summary**: `EMAIL_IMPLEMENTATION_SUMMARY.md`

## 🎯 What Works Now

✅ User signup with email  
✅ Automatic verification email  
✅ Token validation  
✅ Login blocks unverified  
✅ Email expiry (24h)  
✅ Random secure tokens  
✅ Database integration  

## 🔄 User Journey

```
1. User: Fill signup form
2. Frontend: Send to /api/auth/signup
3. Backend: Create user + token
4. Email: Send HTML email
5. User: Click email link
6. Frontend: Auto-verify with token
7. Backend: Mark emailVerified=true
8. User: Can login now ✅
```

## 💡 Pro Tips

- Use **Mailtrap** for testing - free, catches all emails
- Use **Gmail** for production - free, reliable
- Keep `.env` out of git - add to `.gitignore`
- Test both email/token verification flows
- Check email spam folder first if missing

## 📞 Email Providers

| Provider | Setup Time | Cost | Best For |
|----------|-----------|------|----------|
| Mailtrap | 2 min | Free | Testing |
| Gmail | 5 min | Free | Dev/Small |
| SendGrid | 10 min | Free tier | Production |
| AWS SES | 15 min | Cheap | Production |

---

**Status**: ✅ Ready to use!  
**Next**: Create `.env` file with email credentials  
**Time**: 5 minutes to fully working email verification
