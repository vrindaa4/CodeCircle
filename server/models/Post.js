const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [10, 'Content must be at least 10 characters long']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  projectUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
        return v === '' || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['project_idea', 'project_showcase', 'question', 'discussion', 'resource', 'other']
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'closed'],
    default: 'open'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

// Index for better query performance
postSchema.index({ title: 'text', content: 'text', tags: 1 });
postSchema.index({ category: 1 });
postSchema.index({ author: 1 });
postSchema.index({ createdAt: -1 });

// Static method to find posts by tag
postSchema.statics.findByTag = function(tag) {
  return this.find({ tags: tag.toLowerCase() });
};

// Calculate score based on upvotes and downvotes
postSchema.virtual('score').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

module.exports = mongoose.model('Post', postSchema);
