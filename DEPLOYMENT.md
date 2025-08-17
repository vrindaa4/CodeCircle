# CodeCircle - Deployment Guide

## GitHub Repository Setup

### Quick Setup Commands
After creating your GitHub repository, run these commands:

```bash
# Add your GitHub repository as remote (replace with your actual URL)
git remote add origin https://github.com/YOUR_USERNAME/codecircle.git

# Ensure main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## Environment Variables
Create a `.env` file in the root directory with:

```env
# Database - Local Development
MONGODB_URI=mongodb://localhost:27017/codecircle

# Database - Production (MongoDB Atlas)
# Replace with your actual connection string from MongoDB Atlas
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# JWT Secret (generate a strong random string for production)
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5050
NODE_ENV=development

# CORS Origins (for production)
CORS_ORIGIN=http://localhost:3001
```

## Local Development

### Prerequisites
- Node.js (v14+)
- MongoDB (local installation or MongoDB Atlas account)
- Git

### Setup Steps
1. Clone the repository
2. Install dependencies: `npm install && cd client && npm install`
3. Create `.env` file with your configuration
4. Start MongoDB service (if running locally)
5. Run `npm run server` (backend on port 5050)
6. Run `npm run client` (frontend on port 3001)

## Production Deployment

### Backend (Node.js/Express)
Deploy to platforms like:
- **Heroku**: Simple Git-based deployment
- **Railway**: Modern platform with database included
- **DigitalOcean App Platform**: Easy scaling
- **AWS/Azure/GCP**: For enterprise needs

### Frontend (React)
Deploy to platforms like:
- **Netlify**: Automatic deployments from Git
- **Vercel**: Optimized for React/Next.js
- **GitHub Pages**: Free hosting for static sites
- **AWS S3 + CloudFront**: Scalable solution

### Database
- **MongoDB Atlas**: Managed MongoDB service (recommended)
- **Local MongoDB**: For development only

## Team Collaboration

### Git Workflow
1. Clone the main repository
2. Create feature branches: `git checkout -b feature/new-feature`
3. Make changes and commit: `git commit -m "feat: add new feature"`
4. Push branch: `git push origin feature/new-feature`
5. Create Pull Request on GitHub
6. Review and merge

### Development Standards
- Use meaningful commit messages
- Test your changes before pushing
- Update documentation for new features
- Follow the existing code style

## API Documentation

### Base URL
- Development: `http://localhost:5050/api`
- Production: `https://your-domain.com/api`

### Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Error Responses
All errors return consistent format:
```json
{
  "error": "Error message here",
  "details": "Additional details if available"
}
```

## Project Features

### Completed ✅
- User authentication (register/login)
- JWT token management
- Post creation and management
- Comment system
- Team models
- Responsive React frontend
- Security middleware
- Input validation

### Roadmap 🚀
- Real-time notifications
- File upload for posts
- Advanced search functionality
- User reputation system
- Team collaboration features
- Mobile app (React Native)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change PORT in `.env` if 5050/3001 are in use
2. **MongoDB connection**: Ensure MongoDB is running or check Atlas connection string
3. **CORS errors**: Update CORS_ORIGIN in `.env` for production
4. **JWT errors**: Ensure JWT_SECRET is set and consistent

### Getting Help
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check MongoDB connection and database name

## Security Notes

⚠️ **IMPORTANT SECURITY PRACTICES:**

- **Never commit `.env` files** to Git (already in .gitignore)
- **Never include real credentials** in documentation or code
- Use strong, unique JWT secrets in production (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- **Rotate credentials** if accidentally exposed
- Enable HTTPS in production
- Regularly update dependencies: `npm audit`
- Implement rate limiting for production
- Use environment-specific configurations

### MongoDB Atlas Setup
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create database user with strong password
4. Add your IP address to network access
5. Get connection string and replace placeholders:
   - `<username>` - your database username
   - `<password>` - your database password  
   - `<cluster>` - your cluster name
   - `<database>` - your database name (e.g., "codecircle")

## License
MIT License - Feel free to use this project as a starting point for your own applications.
