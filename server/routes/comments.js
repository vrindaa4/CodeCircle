const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { protect, optionalAuth } = require('../middleware/auth');
const { sanitizeInput, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules for creating/updating comments
const commentValidationRules = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Comment must be between 1 and 5000 characters'),
  
  body('codeSnippet.language')
    .optional()
    .isString()
    .withMessage('Code snippet language must be a string'),
  
  body('codeSnippet.code')
    .optional()
    .isString()
    .withMessage('Code snippet must be a string')
];

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/',
  protect,
  sanitizeInput,
  commentValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { content, postId, parentCommentId, codeSnippet } = req.body;
      
      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // If it's a reply, check if parent comment exists
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
          return res.status(404).json({
            success: false,
            message: 'Parent comment not found'
          });
        }
        
        // Make sure parent comment belongs to the same post
        if (parentComment.post.toString() !== postId) {
          return res.status(400).json({
            success: false,
            message: 'Parent comment does not belong to the specified post'
          });
        }
      }
      
      // Create comment
      const comment = await Comment.create({
        content,
        author: req.user._id,
        post: postId,
        parentComment: parentCommentId || null,
        codeSnippet: codeSnippet || { language: null, code: null }
      });
      
      // Populate author for response
      await comment.populate('author', 'username avatar');
      
      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: { comment }
      });
      
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/comments/:commentId/replies
// @desc    Get replies for a comment
// @access  Public (with optional auth for voting info)
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Check if parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Get replies
    const replies = await Comment.find({ 
      parentComment: commentId,
      isDeleted: false
    })
      .sort('-score createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatar')
      .lean();
    
    // Get total count for pagination
    const totalReplies = await Comment.countDocuments({
      parentComment: commentId,
      isDeleted: false
    });
    
    // If user is authenticated, add hasVoted field
    if (req.user) {
      replies.forEach(reply => {
        reply.hasUpvoted = reply.upvotes.some(id => id.toString() === req.user._id.toString());
        reply.hasDownvoted = reply.downvotes.some(id => id.toString() === req.user._id.toString());
        
        // Remove vote arrays to reduce payload size
        delete reply.upvotes;
        delete reply.downvotes;
      });
    }
    
    res.json({
      success: true,
      data: {
        replies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalReplies,
          totalPages: Math.ceil(totalReplies / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Get comment replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (only author)
router.put('/:id',
  protect,
  sanitizeInput,
  commentValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { content, codeSnippet } = req.body;
      
      // Find comment
      const comment = await Comment.findById(id);
      
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }
      
      // Check ownership
      if (comment.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this comment'
        });
      }
      
      // Update fields
      comment.content = content;
      if (codeSnippet) comment.codeSnippet = codeSnippet;
      comment.isEdited = true;
      
      await comment.save();
      await comment.populate('author', 'username avatar');
      
      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment }
      });
      
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/comments/:id
// @desc    Soft-delete a comment (mark as deleted but keep for reply structure)
// @access  Private (only author)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find comment
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check ownership
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }
    
    // Soft delete the comment
    comment.content = '[deleted]';
    comment.isDeleted = true;
    
    await comment.save();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/comments/:id/upvote
// @desc    Upvote a comment
// @access  Private
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    const userId = req.user._id.toString();
    const hasUpvoted = comment.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = comment.downvotes.some(id => id.toString() === userId);
    
    // If already upvoted, remove the upvote (toggle)
    if (hasUpvoted) {
      comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
    } 
    // Otherwise add upvote and remove any downvote
    else {
      comment.upvotes.push(userId);
      if (hasDownvoted) {
        comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
      }
    }
    
    await comment.save();
    
    res.json({
      success: true,
      data: {
        score: comment.upvotes.length - comment.downvotes.length,
        hasUpvoted: !hasUpvoted,
        hasDownvoted: false
      }
    });
    
  } catch (error) {
    console.error('Upvote comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upvote comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/comments/:id/downvote
// @desc    Downvote a comment
// @access  Private
router.post('/:id/downvote', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    const userId = req.user._id.toString();
    const hasUpvoted = comment.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = comment.downvotes.some(id => id.toString() === userId);
    
    // If already downvoted, remove the downvote (toggle)
    if (hasDownvoted) {
      comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
    } 
    // Otherwise add downvote and remove any upvote
    else {
      comment.downvotes.push(userId);
      if (hasUpvoted) {
        comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
      }
    }
    
    await comment.save();
    
    res.json({
      success: true,
      data: {
        score: comment.upvotes.length - comment.downvotes.length,
        hasUpvoted: false,
        hasDownvoted: !hasDownvoted
      }
    });
    
  } catch (error) {
    console.error('Downvote comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to downvote comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
