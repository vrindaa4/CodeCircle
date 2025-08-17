const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom(async (value) => {
      const User = require('../models/User');
      const existingUser = await User.findByUsername(value);
      if (existingUser) {
        throw new Error('Username already exists');
      }
      return true;
    }),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .custom(async (value) => {
      const User = require('../models/User');
      const existingUser = await User.findByEmail(value);
      if (existingUser) {
        throw new Error('Email already registered');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

// Validation rules for user login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for profile update
const profileUpdateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom(async (value, { req }) => {
      const User = require('../models/User');
      const existingUser = await User.findByUsername(value);
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        throw new Error('Username already exists');
      }
      return true;
    }),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const User = require('../models/User');
      const existingUser = await User.findByEmail(value);
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        throw new Error('Email already registered');
      }
      return true;
    }),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Sanitize user input
const sanitizeInput = (req, res, next) => {
  // Remove extra whitespace and trim strings
  if (req.body.username) {
    req.body.username = req.body.username.trim();
  }
  if (req.body.email) {
    req.body.email = req.body.email.trim().toLowerCase();
  }
  if (req.body.bio) {
    req.body.bio = req.body.bio.trim();
  }
  
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  handleValidationErrors,
  sanitizeInput
}; 