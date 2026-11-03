# Email Verification Setup Instructions

## Quick Start (5 minutes)

### 1. Install Nodemailer Package
```bash
cd backend
npm install nodemailer
```

### 2. Create .env File
Copy `.env.example` to `.env` and update with your email settings:

```bash
cp .env.example .env
```

Then edit `backend/.env`:

```
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@renewalradar.com
```

---

## Email Provider Setup

### Option 1: Gmail (Free, Recommended for Development)

1. Go to [Google Account Settings](https://myaccount.google.com)
2. Click "Security" in the left menu
3. Enable "2-Step Verification" if not already done
4. Go to "App passwords" (scroll down)
5. Select "Mail" and "Windows Computer"
6. Google will generate a 16-character password
7. Copy that password and paste it into `.env` as `EMAIL_PASSWORD`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=jdfk nwef ckwe jsdf
```

### Option 2: Mailtrap (Free, Best for Testing)

1. Sign up at [Mailtrap.io](https://mailtrap.io)
2. Create a new project
3. Open the project and go to "SMTP Settings"
4. Copy the credentials:

```env
EMAIL_HOST=live.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-user
EMAIL_PASSWORD=your-mailtrap-password
```

All emails go to a fake inbox - great for testing!

### Option 3: SendGrid (Paid, Production-Ready)

1. Sign up at [SendGrid](https://sendgrid.com)
2. Generate an API key
3. Update `.env`:

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key
```

---

## Verify It's Working

### Step 1: Start the server
```bash
cd backend
npm start
```

### Step 2: Test signup
Open Postman or terminal and run:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Step 3: Check for email
- **Gmail/SendGrid**: Check your inbox
- **Mailtrap**: Check Mailtrap inbox at mailtrap.io

---

## Testing Workflow

### Manual Testing:

1. **Signup**: 
   - Go to `http://localhost:3000/login.html`
   - Click "Sign Up"
   - Enter email, password, name
   - Submit

2. **Get Token**:
   - Check your email inbox
   - Click the "Verify Email Address" button in the email
   - OR manually copy the token from the link

3. **Verify**:
   - Page auto-redirects to verification
   - OR enter token manually at `/verify-email.html`
   - Click "Verify Email"

4. **Login**:
   - Go to `/login.html`
   - Login with the verified email
   - Should succeed (previously failed before email verification)

---

## Troubleshooting

### Problem: "Error: EAUTH: Invalid login"

**Solution**: Check your email credentials in `.env`
- Gmail: Make sure you're using an App Password (not your regular password)
- Mailtrap: Copy exact credentials from their SMTP Settings page

### Problem: "Error: Email already registered"

**Solution**: That email exists but isn't verified. Either:
- Use a different email for testing
- Delete the user from the database

### Problem: "Email not received"

**Solution**: Check spam/junk folder:
- Gmail: Check "Promotions" or "Social" tabs
- Most email providers have a spam folder

### Problem: "No module named 'email'"

**Solution**: Install nodemailer:
```bash
npm install nodemailer
```

---

## File Structure

```
gym-renewal-radar/
├── backend/
│   ├── auth.js           ← UPDATED: Sends email on signup
│   ├── email.js          ← NEW: Email sending logic
│   ├── routes.js         ← Already has verification route
│   ├── package.json      ← UPDATED: Added nodemailer
│   ├── .env              ← CREATED: Your email credentials
│   └── .env.example      ← NEW: Template for .env
├── verify-email.html     ← Frontend page (already works)
├── login.html            ← Signup form here
└── EMAIL_VERIFICATION_GUIDE.md ← Full documentation
```

---

## Complete User Flow

```
1. User enters email, password, name on signup form
   ↓
2. Frontend sends POST /api/auth/signup
   ↓
3. Backend validates and creates user
   ↓
4. Backend generates 64-char random verification token
   ↓
5. Email service sends HTML email with verification link
   ↓
6. User clicks link in email (auto-fills token, auto-verifies)
   OR manually enters token on /verify-email.html
   ↓
7. Frontend sends POST /api/auth/verify-email with token
   ↓
8. Backend validates token and marks emailVerified = 1
   ↓
9. Backend returns JWT token
   ↓
10. Frontend stores token in localStorage
    ↓
11. User can now login normally
```

---

## Production Checklist

When deploying to production:

- [ ] Use production email service (SendGrid, AWS SES, Mailgun, etc.)
- [ ] Update `FRONTEND_URL` to your actual domain
- [ ] Use strong `JWT_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS only
- [ ] Store `.env` in secure environment variables (not in git!)
- [ ] Add rate limiting to signup/verification endpoints
- [ ] Consider "resend verification email" feature
- [ ] Monitor email delivery rates
- [ ] Set up email bounce handling

---

## Next Steps

1. Install nodemailer: `npm install nodemailer`
2. Create `.env` file with email credentials
3. Restart backend server: `npm start`
4. Test signup and email verification
5. Update login.html form to handle signup response

Need help? Check `EMAIL_VERIFICATION_GUIDE.md` for detailed explanations!
