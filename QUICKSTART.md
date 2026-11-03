# Renewal Radar — Quick Start Guide

Get Renewal Radar running in 2 minutes!

## Start the Backend

```bash
cd backend
npm install  # Only needed first time
npm start
```

You'll see:
```
╭────────────────────────────────────╮
│  Renewal Radar Backend             │
│  Server running on port 5000       │
│  Environment: development          │
╰────────────────────────────────────╯
```

## Open the App

Visit http://localhost:5000 in your browser

## Sign Up

1. Click **"Sign up"**
2. Enter:
   - First name (e.g., "John")
   - Last name (optional)
   - Email (e.g., "owner@gym.com")
   - Password (minimum 6 characters)
3. Click **"Create Account"**

## Create a Gym

1. After signup, you'll see the gym selection page
2. Click **"Create Your First Gym"**
3. Enter gym name (e.g., "FitXpress")
4. Enter location (optional, e.g., "Downtown")
5. Click **"Create"**

## Start Managing Members

1. Click your gym to open it
2. Click **"+ Add member"**
3. Enter:
   - Member name
   - WhatsApp number
   - Plan (monthly, quarterly, etc.)
   - Expiry date
   - PT sessions (if applicable)
4. Click **"Save member"**

## Key Features

| Action | How |
|--------|-----|
| **View members by status** | Use tabs: Action, Lapsed, Soon, PT, All |
| **Search members** | Use search box at top |
| **Send WhatsApp reminder** | Click WhatsApp button on member row |
| **Mark member as renewed** | Click Renew button |
| **Update member details** | Click the member row |
| **Add notes** | Click member row, then Note icon |
| **Switch theme** | Click sun/moon icon in top-right |
| **Change gym** | Click "Renewal Radar" logo and select gym |
| **Logout** | Click the logout button (top-right) |

## Database

Your data is automatically saved to SQLite at `backend/renewal-radar.db`

To reset everything:
```bash
# Stop the server (Ctrl+C)
# Delete the database
rm backend/renewal-radar.db

# Restart the server
npm start
```

## Troubleshooting

### "Port 5000 already in use"
```bash
# Change port in backend/.env
PORT=3000

# Or kill the process using port 5000
# On Windows: taskkill /F /IM node.exe
# On Mac/Linux: lsof -ti:5000 | xargs kill -9
```

### "Cannot connect to server"
- Check that backend is running
- Check that you're visiting http://localhost:5000 (not https)
- Try restarting: `npm start`

### "Database is locked"
- Close any other connections
- Delete `backend/renewal-radar.db`
- Restart the server

### "Login not working"
- Check that you used the same email/password
- Passwords are case-sensitive
- Try signing up with a new account

## API Testing

Test endpoints directly in browser console:

```javascript
// Login
await api.login("owner@gym.com", "password123");

// Get gyms
const gyms = await api.getGyms();
console.log(gyms);

// Add member (if gym selected)
await api.addMember(1, {
  name: "John Smith",
  phone: "07700900123",
  plan: "monthly",
  renewalDate: "2025-01-15"
});
```

## Next Steps

- **Customize**: Edit `index.html` to change colors/text
- **Add staff**: Support multiple users per gym (v2.1.0)
- **Integrate WhatsApp**: Connect to WhatsApp Business API
- **Deploy**: Use PM2, Docker, or cloud hosting

## Support

- 📖 Full docs: See `SETUP.md` and `backend/README.md`
- 📊 Product spec: See `SPEC.md`
- 🧪 Validation: See `VALIDATION.md`
- 📝 Changes: See `CHANGELOG.md`

---

**That's it! You're ready to manage gym members. 🎉**
