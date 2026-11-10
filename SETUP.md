# Renewal Radar — Setup Guide

This guide will help you set up and run Renewal Radar with full backend support for user authentication, gym management, and member data persistence.

## Architecture

The app now has two modes:

1. **Demo Mode** (Frontend Only)
   - No authentication required
   - Data stored in browser localStorage
   - Sample data loaded on first run
   - Perfect for testing and demonstrations

2. **Production Mode** (With Backend)
   - Full user authentication (signup/login)
   - Multi-gym support
   - Persistent database (SQLite)
   - Per-user data isolation
   - Activity logging

## Quick Start

### Option 1: Backend Mode (Recommended for Production)

#### 1. Start the Backend Server

```bash
cd backend
npm install  # First time only
npm start
```

The server will:
- Start on http://localhost:5000
- Initialize SQLite database automatically
- Be ready for user authentication

#### 2. Access the Application

Open http://localhost:5000 in your browser

The app will:
1. Redirect to login page if not authenticated
2. Allow you to create an account or login
3. Let you create/select your gym
4. Load the main dashboard with your data

### Option 2: Demo Mode (Frontend Only)

Simply open `index.html` directly in your browser or serve it statically:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server .

# Windows
Start-Process "c:\path\to\index.html"
```

This will:
- Load demo gym data
- Use browser localStorage for saving
- Run entirely offline
- No authentication needed

## File Structure

```
gym-renewal-radar/
├── index.html              # Main app (works with backend)
├── login.html              # Login/signup page
├── gym-select.html         # Gym selection page
├── frontend.js             # API client & state management
├── README.md               # Project documentation
├── SPEC.md                 # Product specification
├── VALIDATION.md           # Customer validation questions
├── SETUP.md                # This file
│
└── backend/                # Backend server
    ├── server.js           # Express app entry point
    ├── db.js               # Database setup
    ├── auth.js             # Authentication logic
    ├── routes.js           # API endpoints
    ├── package.json        # Dependencies
    ├── .env                # Environment variables
    ├── README.md           # Backend documentation
    └── renewal-radar.db    # SQLite database (auto-created)
```

## Features Added

### Authentication System
- Secure signup/login with password hashing (bcryptjs)
- JWT-based session management
- Token expiry (7 days)
- Automatic redirect to login when session expires

### Gym Management
- Create multiple gyms
- Each gym is owned by a user
- Update gym details (name, location)
- Export gym data as JSON backup

### Member Management
- Backend persistence of all member data
- All operations sync with database:
  - Add members
  - Update member details
  - Delete members
  - Mark members as left
  - Track PT sessions
  - Store member notes

### Data Integrity
- Activity logging for audit trail
- Foreign key constraints
- Automatic timestamps
- Data isolation per user

## Environment Variables

The backend uses a `.env` file for configuration. Copy `backend/.env.example` to `backend/.env` and fill in the values.

```env
PORT=5000                          # Server port
NODE_ENV=production                # Environment (development/production)
JWT_SECRET=your-secret-key         # Secret for JWT signing (change in production!)
TURSO_DATABASE_URL=libsql://...    # Turso DB URL (production persistence)
TURSO_AUTH_TOKEN=your-token        # Turso auth token
FRONTEND_URL=https://your.app      # Base URL for email links
EMAIL_HOST=smtp.mailtrap.io        # SMTP host
EMAIL_PORT=587                     # SMTP port
EMAIL_SECURE=false                 # true for port 465
EMAIL_USER=your-user               # SMTP username
EMAIL_PASSWORD=your-password       # SMTP password
DEMO_EMAIL=demo@renewalradar.com   # Seeded demo account
DEMO_PASSWORD=Demo12345            # Seeded demo password
```

**Important**: For production, set a strong random `JWT_SECRET`.

### Database (Turso / libSQL)

- **Production (recommended):** set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (from [Turso](https://turso.tech)). Data then persists across restarts and redeploys.
- **Local dev:** leave both unset and the app falls back to a local `backend/renewal-radar.db` file automatically — no cloud setup needed.

## Deploying

### Option A — Vercel (serverless)

Vercel runs the app as a single serverless Function. The project is already
structured for it:

- `app.js` (root) — the Vercel entry point (exports the Express app).
- `backend/app.js` — the Express app itself (no `app.listen()`).
- `public/` — static frontend files (Vercel serves these from its CDN).
- `package.json` (root) — dependencies Vercel installs.

To deploy:

1. Push the repo to GitHub.
2. On [vercel.com](https://vercel.com/new), import the repository.
3. Vercel auto-detects Express (zero config). No build command needed.
4. Add the same environment variables (JWT_SECRET, TURSO_DATABASE_URL,
   TURSO_AUTH_TOKEN, FRONTEND_URL, EMAIL_*) in Project → Settings →
   Environment Variables.
5. Deploy.

Notes:

- `express.static()` is ignored on Vercel — static files must stay in `public/`.
- Database init runs lazily on the first request of each warm instance.
- Verification email is sent in the background; on serverless it may not always
  complete after the response returns. Login does not require verification.

### Option B — Render (long-running server)

`backend/server.js` is a normal Express server that listens on a port.
Deploy it as a Node.js web service on Render with:

- **Build command:** `npm install`
- **Start command:** `node server.js`
- **Root directory:** `backend`

Set the same environment variables listed above.


## API Endpoints

### Authentication
- `POST /api/auth/signup` — Create account
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Gyms
- `GET /api/gyms` — List user's gyms
- `POST /api/gyms` — Create new gym
- `GET /api/gyms/:id` — Get gym details
- `PUT /api/gyms/:id` — Update gym

### Members
- `GET /api/gyms/:gymId/members` — List members
- `POST /api/gyms/:gymId/members` — Add member
- `GET /api/gyms/:gymId/members/:memberId` — Get member
- `PUT /api/gyms/:gymId/members/:memberId` — Update member
- `DELETE /api/gyms/:gymId/members/:memberId` — Delete member
- `GET /api/gyms/:gymId/export` — Export all members

Full API documentation in [backend/README.md](backend/README.md)

## Testing the Backend

### Test with cURL

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@gym.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@gym.com",
    "password": "password123"
  }'

# Create gym (use token from login)
curl -X POST http://localhost:5000/api/gyms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FitXpress",
    "location": "Downtown"
  }'
```

### Test with Browser DevTools

Open the browser console and use the `api` object:

```javascript
// Signup
await api.signup("owner@gym.com", "password123", "John", "Doe");

// Login
await api.login("owner@gym.com", "password123");

// Get gyms
await api.getGyms();

// Create gym
await api.createGym("MyGym", "Location");

// List members (after selecting gym)
await api.getMembers(1);
```

## Troubleshooting

### Backend won't start
```
Error: listen EADDRINUSE :::5000
```
- Another process is using port 5000
- Change `PORT` in `.env` or kill the existing process

### "Cannot GET /" after starting server
- Server is running but needs database initialization
- This happens automatically on first run
- Check console for "Database initialized" message

### Database errors
- Delete `backend/renewal-radar.db` to reset
- Restart the server
- It will recreate the database schema automatically

### Members not syncing
- Check browser console for network errors
- Verify token is valid (hasn't expired)
- Check backend logs for API errors

## Development

### Watch Mode (Auto-reload)

```bash
cd backend
npm run dev
```

Changes to server files will automatically restart the server.

### Database Inspection

View the SQLite database:

```bash
# Install sqlite3 CLI if needed
sqlite3 backend/renewal-radar.db

# Common queries
SELECT * FROM users;
SELECT * FROM gyms;
SELECT * FROM members;
SELECT * FROM activity_log;
```

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET**
   ```env
   JWT_SECRET=generate-a-strong-random-string-here
   ```

2. **Set NODE_ENV to production**
   ```env
   NODE_ENV=production
   ```

3. **Use a production database** (optional)
   - Consider switching from SQLite to PostgreSQL
   - Update DB connection in `db.js`

4. **Enable security headers**
   - Add CORS restrictions
   - Set up HTTPS
   - Implement rate limiting

5. **Set up monitoring**
   - Error logging
   - Performance monitoring
   - Database backups

6. **Use a process manager**
   - PM2, systemd, or similar
   - Ensure server restarts on crash

## Support

For issues or questions:
- Check [Backend README](backend/README.md) for API details
- Review [Product Spec](SPEC.md) for features
- Check [Validation Notes](VALIDATION.md) for customer research

## License

This project is provided as-is. Modify and use as needed for your business.
