const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect, optionalAuth } = require('../middleware/auth');
const { sanitizeInput, handleValidationErrors } = require('../middleware/validation');
const { body, query } = require('express-validator');

const router = express.Router();

// Validation rules for creating/updating posts
const postValidationRules = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('category')
    .isIn(['project_idea', 'project_showcase', 'question', 'discussion', 'resource', 'other'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom(tags => {
      if (tags && tags.length > 5) {
        throw new Error('Maximum 5 tags allowed');
      }
      return true;
    }),
  
  body('projectUrl')
    .optional()
    .isURL()
    .withMessage('Project URL must be a valid URL')
];

// @route   GET /api/posts
// @desc    Get all posts with pagination and filtering
// @access  Public (with optional auth for voting info)
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || '-createdAt';
    const category = req.query.category;
    const tag = req.query.tag;
    const query = req.query.search;
    
    // Build filter object
    const filter = { isArchived: false };
    
    if (category) {
      filter.category = category;
    }
    
    if (tag) {
      filter.tags = tag.toLowerCase();
    }
    
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const posts = await Post.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatar')
      .lean();
    
    // Get total count for pagination
    const totalPosts = await Post.countDocuments(filter);
    
    // If user is authenticated, add hasVoted field
    if (req.user) {
      posts.forEach(post => {
        post.hasUpvoted = post.upvotes.some(id => id.toString() === req.user._id.toString());
        post.hasDownvoted = post.downvotes.some(id => id.toString() === req.user._id.toString());
        
        // Remove vote arrays to reduce payload size
        delete post.upvotes;
        delete post.downvotes;
      });
    }
    
    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          totalPosts,
          totalPages: Math.ceil(totalPosts / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a single post by ID with comments
// @access  Public (with optional auth for voting info)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .lean();
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Increment view count
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    // Get comments
    const comments = await Comment.find({ 
      post: post._id, 
      parentComment: null,
      isDeleted: false
    })
      .sort('-score createdAt')
      .populate('author', 'username avatar')
      .lean();
    
    // If user is authenticated, add hasVoted field
    if (req.user) {
      // For the post
      post.hasUpvoted = post.upvotes.some(id => id.toString() === req.user._id.toString());
      post.hasDownvoted = post.downvotes.some(id => id.toString() === req.user._id.toString());
      
      // For comments
      comments.forEach(comment => {
        comment.hasUpvoted = comment.upvotes.some(id => id.toString() === req.user._id.toString());
        comment.hasDownvoted = comment.downvotes.some(id => id.toString() === req.user._id.toString());
        
        // Remove vote arrays to reduce payload size
        delete comment.upvotes;
        delete comment.downvotes;
      });
    }
    
    // Remove vote arrays from post to reduce payload size
    delete post.upvotes;
    delete post.downvotes;
    
    res.json({
      success: true,
      data: {
        post,
        comments
      }
    });
    
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/',
  protect,
  sanitizeInput,
  postValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title, content, category, tags, projectUrl, status } = req.body;
      
      // Create post
      const post = await Post.create({
        title,
        content,
        category,
        tags: tags ? tags.map(tag => tag.toLowerCase()) : [],
        projectUrl: projectUrl || '',
        status: status || 'open',
        author: req.user._id
      });
      
      // Populate author info for response
      await post.populate('author', 'username avatar');
      
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: { post }
      });
      
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (only author)
router.put('/:id',
  protect,
  sanitizeInput,
  postValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Find post
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Check ownership
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this post'
        });
      }
      
      // Update fields
      const { title, content, category, tags, projectUrl, status } = req.body;
      
      post.title = title;
      post.content = content;
      post.category = category;
      if (tags) post.tags = tags.map(tag => tag.toLowerCase());
      if (projectUrl !== undefined) post.projectUrl = projectUrl;
      if (status) post.status = status;
      
      await post.save();
      await post.populate('author', 'username avatar');
      
      res.json({
        success: true,
        message: 'Post updated successfully',
        data: { post }
      });
      
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (only author)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Find post
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }
    
    // Delete post and its comments
    await Promise.all([
      Post.findByIdAndDelete(req.params.id),
      Comment.deleteMany({ post: req.params.id })
    ]);
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/posts/:id/upvote
// @desc    Upvote a post
// @access  Private
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    const userId = req.user._id.toString();
    const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = post.downvotes.some(id => id.toString() === userId);
    
    // If already upvoted, remove the upvote (toggle)
    if (hasUpvoted) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    } 
    // Otherwise add upvote and remove any downvote
    else {
      post.upvotes.push(userId);
      if (hasDownvoted) {
        post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
      }
    }
    
    await post.save();
    
    res.json({
      success: true,
      data: {
        score: post.upvotes.length - post.downvotes.length,
        hasUpvoted: !hasUpvoted,
        hasDownvoted: false
      }
    });
    
  } catch (error) {
    console.error('Upvote post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upvote post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/posts/:id/downvote
// @desc    Downvote a post
// @access  Private
router.post('/:id/downvote', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    const userId = req.user._id.toString();
    const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = post.downvotes.some(id => id.toString() === userId);
    
    // If already downvoted, remove the downvote (toggle)
    if (hasDownvoted) {
      post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
    } 
    // Otherwise add downvote and remove any upvote
    else {
      post.downvotes.push(userId);
      if (hasUpvoted) {
        post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
      }
    }
    
    await post.save();
    
    res.json({
      success: true,
      data: {
        score: post.upvotes.length - post.downvotes.length,
        hasUpvoted: false,
        hasDownvoted: !hasDownvoted
      }
    });
    
  } catch (error) {
    console.error('Downvote post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to downvote post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
