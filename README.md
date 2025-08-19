# CodeCircle - Developer Collaboration Platform

## Project Overview
CodeCircle is a modern collaboration platform designed for developers, combining the best features of Reddit-style discussions and StackOverflow-style Q&A. It provides a comprehensive environment for developers to share knowledge, collaborate on projects, and build communities.

## Features Implemented
- ✅ User registration and authentication with JWT
- ✅ Secure password hashing with bcrypt
- ✅ Protected routes middleware
- ✅ User profile management
- ✅ Post creation and management system
- ✅ Comment system for discussions
- ✅ Team collaboration features

## Tech Stack
- **Backend**: Node.js + Express
- **Authentication**: JWT + bcrypt
- **Database**: MongoDB + Mongoose
- **Frontend**: React + Context API
- **Security**: bcrypt

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### 1. Clone and Install
```bash
git clone https://github.com/vrindaa4/codecircle.git
cd codecircle
npm install
cd client && npm install && cd ..
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your MongoDB connection string and JWT secret
```

### 3. Start Development Servers
```bash
# Start backend (port 5050)
npm run server

# In a new terminal, start frontend (port 3001)
npm run client
```

Visit:
- Frontend: http://localhost:3001
- Backend API: http://localhost:5050

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post (protected)
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `POST /api/posts/:id/vote` - Vote on post (protected)

### Comments
- `GET /api/posts/:postId/comments` - Get post comments
- `POST /api/posts/:postId/comments` - Add comment (protected)
- `PUT /api/comments/:id` - Update comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected)

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
│   │   └── db.js              # Database connection
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── validation.js      # Input validation
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Post.js            # Post model
│   │   ├── Comment.js         # Comment model
│   │   └── Team.js            # Team model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── posts.js           # Post management routes
│   │   └── comments.js        # Comment routes
│   └── index.js               # Main server file
├── client/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React Context providers
│   │   ├── pages/             # Main application pages
│   │   ├── App.js             # Main app component
│   │   └── index.js           # React entry point
│   ├── public/
│   └── package.json
├── package.json               # Root package configuration
├── .gitignore                 # Git ignore rules
├── env.example                # Environment variables template
└── README.md                  # Project documentation
```

## Development Features
- **Error Handling**: Comprehensive error handling and validation
- **Security**: JWT authentication, password hashing
- **Modern UI**: Responsive design with modern CSS
- **Team Ready**: Built for collaborative development

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Team Integration
This platform is designed for seamless team collaboration:
- Clear API contracts for easy integration
- Standardized error responses
- JWT tokens for secure session management
- Modular architecture for easy feature additions
- Comprehensive documentation for team onboarding 
