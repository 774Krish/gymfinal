# Renewal Radar Backend

Full-featured backend for Renewal Radar with authentication, gym management, and member data persistence.

## Features

- **User Authentication**: Signup and login with secure password hashing
- **Multi-Gym Support**: Users can own and manage multiple gyms
- **Member Management**: Add, update, and delete gym members
- **Data Persistence**: SQLite database for reliable data storage
- **REST API**: Complete API for all operations
- **Role-Based Access**: Ensure users can only access their own gyms

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with defaults. For production, update these values:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-strong-secret-key-here
DB_PATH=./renewal-radar.db
```

### 3. Start the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The server will start on `http://localhost:5000` and automatically initialize the database.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user (requires auth) |

### Gyms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gyms` | List user's gyms (requires auth) |
| POST | `/api/gyms` | Create new gym (requires auth) |
| GET | `/api/gyms/:id` | Get gym details (requires auth) |
| PUT | `/api/gyms/:id` | Update gym (requires auth) |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gyms/:gymId/members` | List gym members (requires auth) |
| POST | `/api/gyms/:gymId/members` | Add member (requires auth) |
| GET | `/api/gyms/:gymId/members/:memberId` | Get member details (requires auth) |
| PUT | `/api/gyms/:gymId/members/:memberId` | Update member (requires auth) |
| DELETE | `/api/gyms/:gymId/members/:memberId` | Delete member (requires auth) |
| GET | `/api/gyms/:gymId/export` | Export all members as JSON (requires auth) |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

1. User logs in with `/api/auth/login`
2. Server returns a token
3. Client stores token in localStorage as `rr_token`
4. For authenticated requests, include the token in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```

Tokens expire after 7 days.

## Database Schema

### users
- `id`: Primary key
- `email`: Unique user email
- `password`: Bcrypt-hashed password
- `firstName`: User's first name
- `lastName`: User's last name
- `createdAt`: Account creation timestamp

### gyms
- `id`: Primary key
- `ownerId`: Foreign key to users
- `name`: Gym name
- `location`: Gym location
- `createdAt`: Creation timestamp

### members
- `id`: Primary key
- `gymId`: Foreign key to gyms
- `name`: Member name
- `phone`: Phone number
- `email`: Email address
- `plan`: Membership plan type
- `startDate`: Membership start date
- `renewalDate`: Current renewal/expiry date
- `lastRenewalDate`: Date of last renewal
- `status`: Member status (active, left)
- `ptSessions`: Total PT sessions
- `ptSessionsRemaining`: Remaining PT sessions
- `notes`: Member notes
- `createdAt`, `updatedAt`: Timestamps

### user_gyms
- Manages relationships between users and gyms
- Allows for future multi-owner support per gym
- Stores user role (owner, manager, etc.)

### activity_log
- Audit trail of all actions
- Tracks who did what and when

## Error Handling

All errors are returned as JSON with appropriate HTTP status codes:

```json
{
  "error": "Description of the error"
}
```

Common status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (access denied)
- `404`: Not found
- `500`: Server error

## Frontend Integration

The frontend (`frontend.js`) provides a convenient API client:

```javascript
// Authentication
await api.signup(email, password, firstName, lastName);
await api.login(email, password);
await api.getCurrentUser();

// Gyms
await api.getGyms();
await api.createGym(name, location);
await api.updateGym(gymId, name, location);

// Members
await api.addMember(gymId, memberData);
await api.getMembers(gymId);
await api.updateMember(gymId, memberId, updates);
await api.deleteMember(gymId, memberId);
await api.exportGymData(gymId);
```

## File Structure

```
backend/
├── server.js        # Express app and startup
├── db.js            # Database initialization and helpers
├── auth.js          # Authentication logic
├── routes.js        # API endpoints
├── package.json     # Dependencies
├── .env             # Environment variables
└── renewal-radar.db # SQLite database (created on startup)
```

## Development Tips

- **Hot Reload**: Use `npm run dev` during development for automatic server restart
- **Database Reset**: Delete `renewal-radar.db` to start fresh
- **CORS**: CORS is enabled for local development. Restrict in production!
- **JWT Secret**: Change `JWT_SECRET` in `.env` for production
- **Testing**: Use a tool like Postman, curl, or VS Code REST Client

## Troubleshooting

### Database Locked
```
Error: database is locked
```
- Close any other connections to the database
- Try deleting `renewal-radar.db` and restarting

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
- Change `PORT` in `.env` to an available port
- Or kill the process using the port

### Authentication Failed
- Ensure token is properly formatted in Authorization header
- Verify token hasn't expired (7 days)
- Check that user exists in database

## Security Considerations

1. **Password Hashing**: Bcryptjs with 10 rounds
2. **JWT Validation**: Tokens are validated on each request
3. **CORS**: Currently allows all origins (restrict in production)
4. **SQL Injection**: Parameterized queries used throughout
5. **Rate Limiting**: Not implemented yet (consider for production)

## Future Enhancements

- [ ] Rate limiting
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Multi-user gym access (roles: owner, manager, staff)
- [ ] Audit logging
- [ ] Backup/restore functionality
- [ ] Webhook support for member events
- [ ] API key authentication for integrations
