const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate a JWT token
const generateToken = (userId) => {
  // The token payload contains the user's ID
  // The secret key is used to sign the token
  // The token will expire in 7 days
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// --- User Registration ---
// @route   POST /api/auth/register
// @desc    Create a new user account
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check if all required fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // 2. Check if a user with that email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 3. Create a new user in the database
    const user = await User.create({
      username,
      email,
      password
    });

    // 4. Generate a token for the new user
    const token = generateToken(user._id);

    // 5. Send a success response with the token
    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// --- User Login ---
// @route   POST /api/auth/login
// @desc    Log in an existing user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if all required fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2. Find the user by email (and include the password in the result)
    const user = await User.findOne({ email }).select('+password');

    // 3. If no user is found, or if the password doesn't match, send an error
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Generate a token for the logged-in user
    const token = generateToken(user._id);

    // 5. Send a success response with the token
    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// --- Get Current User ---
// @route   GET /api/auth/me
// @desc    Get the profile of the currently logged-in user
// @access  Private (requires a valid token)
router.get('/me', protect, async (req, res) => {
  try {
    // The 'protect' middleware has already found the user and attached it to the request object.
    // req.user is available here.
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;