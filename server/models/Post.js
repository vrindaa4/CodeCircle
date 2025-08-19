const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A post must have a title'],
    trim: true,
    minlength: 5
  },
  content: {
    type: String,
    required: [true, 'A post must have content'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This creates a reference to the User model
    required: true
  },
  tags: [String], // A simple array of strings for tags
  
  // Voting system
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
}, {
  // Add timestamps (createdAt, updatedAt)
  timestamps: true,
  // Enable virtual properties to be included in JSON and object outputs
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- Mongoose Virtuals ---

// A virtual property 'score' is not stored in the database
// but calculated on the fly when you access it.
postSchema.virtual('score').get(function() {
  // 'this' refers to the current post document
  return this.upvotes.length - this.downvotes.length;
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
