const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Hide password from query results by default
  }
}, {
  // Add timestamps (createdAt, updatedAt)
  timestamps: true
});

// --- Mongoose Middleware ---

// Before saving a user, hash the password if it's new or has been changed
userSchema.pre('save', async function(next) {
  // 'this' refers to the current user document
  if (!this.isModified('password')) {
    return next(); // If password hasn't changed, move to the next middleware
  }

  // Hash the password with a salt round of 10
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Mongoose Methods ---

// Add a method to the user schema to compare entered password with the stored hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
  // 'this' refers to the current user document
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;