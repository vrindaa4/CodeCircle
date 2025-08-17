const express = require('express');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { 
  registerValidation, 
  loginValidation, 
  profileUpdateValidation,
  handleValidationErrors,
  sanitizeInput 
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  sanitizeInput,
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Create user
      const user = await User.create({
        username,
        email,
        password
      });

      // Generate token
      const token = generateToken(user._id);

      // Send response
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.getPublicProfile(),
          token
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  sanitizeInput,
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email and include password for comparison
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Send response
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.getPublicProfile(),
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
  protect,
  sanitizeInput,
  profileUpdateValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, bio, avatar } = req.body;
      const updateFields = {};

      // Only update fields that are provided
      if (username !== undefined) updateFields.username = username;
      if (email !== undefined) updateFields.email = email;
      if (bio !== undefined) updateFields.bio = bio;
      if (avatar !== undefined) updateFields.avatar = avatar;

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateFields,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser.getPublicProfile()
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @route   GET /api/auth/verify
// @desc    Verify token validity
// @access  Private
router.get('/verify', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user.getPublicProfile()
    }
  });
});

module.exports = router; 