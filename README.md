# Online Forum - Authentication System

## Project Overview
This is the authentication component of an online forum/discussion board. It provides user registration, login, and authorization functionality using JWT tokens.

## Features Implemented
- ✅ User registration with validation
- ✅ User login with JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Protected routes middleware
- ✅ User profile management
- ✅ JWT token verification
- ✅ Rate limiting for security
- ✅ Input validation and sanitization

## Tech Stack
- **Backend**: Node.js + Express
- **Authentication**: Passport.js + JWT
- **Database**: MongoDB + Mongoose
- **Frontend**: React + Context API
- **Security**: bcrypt, helmet, rate limiting

## Quick Start

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. Start Development Servers
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Request/Response Examples

#### Register User
```json
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login User
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

## Project Structure
```
├── server/
│   ├── config/
│   │   ├── db.js          # Database connection
│   │   └── passport.js    # Passport configuration
│   ├── middleware/
│   │   ├── auth.js        # JWT authentication middleware
│   │   └── validation.js  # Input validation
│   ├── models/
│   │   └── User.js        # User model
│   ├── routes/
│   │   └── auth.js        # Authentication routes
│   └── index.js           # Main server file
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── package.json
```

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on auth endpoints
- Input validation and sanitization
- CORS configuration
- Helmet security headers

## Team Integration
This authentication system is designed to be easily integrated with other team members' work:
- Clear API contracts
- Standardized error responses
- JWT tokens for session management
- Protected route middleware ready for use 