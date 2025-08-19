const jwt = require('jsonwebtoken');
const User = require('../models/User');

// This middleware function is designed to protect routes that require a user to be logged in.
const protect = async (req, res, next) => {
  let token;

  // 1. Check if the request has an 'Authorization' header, and if it starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extract the token from the header (it's the part after 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using the secret key. This will decode the payload if the token is valid.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user in the database using the ID from the decoded token payload.
      // We exclude the password from the result for security.
      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // 5. If everything is successful, call the next middleware in the stack.
      next();

    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found in the header at all, send an error.
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// This middleware is for routes where authentication is optional.
// For example, viewing posts. If a user is logged in, we can show them extra info (like if they've upvoted a post).
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
      // If the token is invalid or expired, we don't send an error.
      // We just clear req.user and move on, because authentication is optional.
      req.user = null;
    }
  }
  
  // Always call next() to proceed to the route handler.
  next();
};


module.exports = { protect, optionalAuth };