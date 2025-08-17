const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    minlength: [3, 'Team name must be at least 3 characters long'],
    maxlength: [50, 'Team name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Team description is required'],
    trim: true,
    maxlength: [1000, 'Team description cannot exceed 1000 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  isOpen: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  maxMembers: {
    type: Number,
    default: 10
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
teamSchema.index({ name: 'text', description: 'text', tags: 1 });
teamSchema.index({ creator: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ isOpen: 1 });

// Virtual for discussions
teamSchema.virtual('discussions', {
  ref: 'TeamDiscussion',
  localField: '_id',
  foreignField: 'team'
});

module.exports = mongoose.model('Team', teamSchema);
