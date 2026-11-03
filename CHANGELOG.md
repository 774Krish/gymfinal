# Renewal Radar — Changelog

## v2.0.0 — Backend & Authentication (Latest)

### ✨ New Features

#### Authentication System
- User registration (signup) with email and password
- Secure login system with JWT tokens
- Session management (7-day token expiry)
- Automatic token refresh on page load
- Account creation with first/last name

#### Gym Management
- Create multiple gyms per account
- Update gym name and location
- Gym selection interface for switching between gyms
- Each gym stores its own member data

#### Member Management (Persistent)
- All member data now persists to backend database
- Sync member additions, updates, and deletions
- Maintain member notes and PT session tracking
- Member status tracking (active/left)
- Automatic timestamp tracking

#### Pages
- `login.html` — New login/signup page with theme toggle
- `gym-select.html` — New gym selection and creation interface
- `index.html` — Updated to work with backend authentication

#### API Client
- `frontend.js` — Complete API client for backend communication
  - Authentication methods (signup, login)
  - Gym management (list, create, update)
  - Member management (add, update, delete, list)
  - Data export functionality
  - Automatic token handling

#### Backend Server
- Express.js REST API
- SQLite database with schema
- Authentication endpoints
- Gym and member management endpoints
- Activity logging system
- Role-based access control

### 🔧 Technical Changes

#### Database Schema
- `users` — User accounts with hashed passwords
- `gyms` — Gym records linked to owners
- `members` — Member data with all tracking fields
- `user_gyms` — User-gym relationship table
- `activity_log` — Audit trail of actions

#### Security
- Bcryptjs password hashing (10 rounds)
- JWT-based authentication
- Per-user data isolation
- SQL injection prevention with parameterized queries
- CORS enabled for development

#### Frontend Integration
- Automatic backend sync for all member operations
- Graceful fallback to localStorage if backend unavailable
- Toast notifications for sync status
- Seamless authentication flow

### 📝 Documentation
- `SETUP.md` — Complete setup and deployment guide
- `backend/README.md` — Backend API documentation
- Updated `README.md` with new features

### 🐛 Bug Fixes
- Removed demo data reset button when using backend
- Fixed member data transformation between frontend/backend formats
- Proper error handling for API failures

### ⚙️ Configuration
- Environment variables in `.env` file
- Configurable database path
- Configurable JWT secret
- Configurable server port

### 📦 Dependencies Added
- `express` ^4.18.2 — Web framework
- `sqlite3` ^5.1.6 — Database
- `bcryptjs` ^2.4.3 — Password hashing
- `jsonwebtoken` ^9.0.0 — JWT authentication
- `cors` ^2.8.5 — Cross-origin requests
- `dotenv` ^16.0.3 — Environment configuration

## v1.0.0 — Original Release

### Features
- Single-page gym member management interface
- Dark/light theme toggle
- Member list with status indicators (lapsed, expiring, active)
- WhatsApp integration for member reminders
- PT session tracking
- Member notes
- Search and filtering
- Sort by urgency, A-Z, Z-A
- Import member list from text
- Demo data with 12 sample members
- Browser-based data storage with localStorage
- i18n support for internationalization

### Pages
- `index.html` — Main application

### Data
- All data stored in browser localStorage
- No server required
- Completely offline-capable

---

## Migration Guide: v1.0.0 → v2.0.0

### For Existing Users

#### Option 1: Keep Using Demo Mode
No changes needed! The app still works as a demo:
1. Open `index.html` directly
2. Use demo data and localStorage
3. No authentication required

#### Option 2: Upgrade to Backend
To migrate existing data:
1. Start the backend server (`npm start` in `backend/`)
2. Go to http://localhost:5000
3. Sign up for a new account
4. Create a gym
5. Import your data using the import feature in the UI

#### Data Backup
Before upgrading:
1. In the original demo, click the export button (if available)
2. Save the exported JSON
3. Import it into your backend gym

### Breaking Changes
- Direct localStorage access no longer recommended
- All data now server-side (with localStorage fallback)
- Token-based API instead of open access

### What's Compatible
- All existing member data formats
- Plans, PT sessions, notes
- Theme preferences (transferred to localStorage)
- Search and sorting functionality

---

## Known Issues

None currently. Please report issues via GitHub or email.

---

## Roadmap

### v2.1.0 (Planned)
- [ ] Password reset functionality
- [ ] Email verification on signup
- [ ] Multi-user gym access (staff accounts)
- [ ] Bulk member import from CSV
- [ ] Automated WhatsApp reminders
- [ ] Dashboard with analytics

### v2.2.0 (Future)
- [ ] Mobile app (React Native)
- [ ] Payment integration
- [ ] Multi-language support expansion
- [ ] Advanced reporting

### v3.0.0 (Future)
- [ ] Multi-branch support
- [ ] Attendance tracking
- [ ] PT package management
- [ ] Online payments
- [ ] Member portal

---

## Contributors

- Original concept and design: Renewal Radar Team
- Backend implementation: Dev Team

---

## License

Proprietary - For internal use only.
