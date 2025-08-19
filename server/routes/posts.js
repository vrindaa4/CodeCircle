const express = require('express');
const Post = require('../models/Post');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// --- Create a New Post ---
// @route   POST /api/posts
// @desc    Create a new discussion post
// @access  Private (requires login)
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    // Basic validation
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Create the new post
    const newPost = await Post.create({
      title,
      content,
      tags: tags || [], // Default to an empty array if no tags are provided
      author: req.user._id // The author is the logged-in user
    });

    // Populate the author's username for the response
    const post = await Post.findById(newPost._id).populate('author', 'username');

    res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      data: post
    });

  } catch (error) {
    console.error('Create Post Error:', error);
    res.status(500).json({ message: 'Server error while creating post' });
  }
});

// --- Get All Posts ---
// @route   GET /api/posts
// @desc    Fetch all posts
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username') // Show author's username
      .sort({ createdAt: -1 }) // Show newest posts first
      .lean(); // Use .lean() for faster queries

    // If a user is logged in, check if they have voted on each post
    if (req.user) {
      posts.forEach(post => {
        const userId = req.user._id.toString();
        post.hasUpvoted = post.upvotes.some(id => id.toString() === userId);
        post.hasDownvoted = post.downvotes.some(id => id.toString() === userId);
      });
    }

    res.status(200).json({
      success: true,
      data: posts
    });

  } catch (error) {
    console.error('Get Posts Error:', error);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
});

// --- Get a Single Post by ID ---
// @route   GET /api/posts/:id
// @desc    Fetch a single post by its ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username')
      .lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // If a user is logged in, check their vote status for this post
    if (req.user) {
      const userId = req.user._id.toString();
      post.hasUpvoted = post.upvotes.some(id => id.toString() === userId);
      post.hasDownvoted = post.downvotes.some(id => id.toString() === userId);
    }

    res.status(200).json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Get Single Post Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Upvote a Post ---
// @route   POST /api/posts/:id/upvote
// @desc    Add an upvote to a post
// @access  Private
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;

    // Logic to handle voting:
    // 1. Remove user from downvotes if they are there
    post.downvotes.pull(userId);
    // 2. Toggle user's upvote
    if (post.upvotes.includes(userId)) {
      post.upvotes.pull(userId); // Remove upvote
    } else {
      post.upvotes.push(userId); // Add upvote
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Vote updated',
      data: {
        score: post.score,
        hasUpvoted: post.upvotes.includes(userId),
        hasDownvoted: false
      }
    });

  } catch (error) {
    console.error('Upvote Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Downvote a Post ---
// @route   POST /api/posts/:id/downvote
// @desc    Add a downvote to a post
// @access  Private
router.post('/:id/downvote', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;

    // Logic to handle voting:
    // 1. Remove user from upvotes if they are there
    post.upvotes.pull(userId);
    // 2. Toggle user's downvote
    if (post.downvotes.includes(userId)) {
      post.downvotes.pull(userId); // Remove downvote
    } else {
      post.downvotes.push(userId); // Add downvote
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Vote updated',
      data: {
        score: post.score,
        hasUpvoted: false,
        hasDownvoted: post.downvotes.includes(userId)
      }
    });

  } catch (error) {
    console.error('Downvote Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
