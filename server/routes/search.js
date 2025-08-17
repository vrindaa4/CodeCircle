const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const Team = require('../models/Team');
const Comment = require('../models/Comment');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search
// @desc    Global search across posts, users, and teams
// @access  Public (with optional auth)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      q: query, 
      type = 'all', 
      page = 1, 
      limit = 10,
      category,
      tags,
      sortBy = 'relevance'
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchQuery = query.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const results = {};

    // Helper function to build sort object
    const buildSort = (sortBy) => {
      switch (sortBy) {
        case 'newest':
          return { createdAt: -1 };
        case 'oldest':
          return { createdAt: 1 };
        case 'popular':
          return { score: -1, createdAt: -1 };
        default:
          return { score: { $meta: 'textScore' }, createdAt: -1 };
      }
    };

    // Search Posts
    if (type === 'all' || type === 'posts') {
      const postFilter = {
        $text: { $search: searchQuery },
        isArchived: false
      };

      if (category) {
        postFilter.category = category;
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        postFilter.tags = { $in: tagArray.map(tag => tag.toLowerCase()) };
      }

      const posts = await Post.find(postFilter)
        .select('title content category tags upvotes downvotes createdAt author views')
        .populate('author', 'username avatar reputation')
        .sort(buildSort(sortBy))
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Add voting info for authenticated users
      if (req.user) {
        posts.forEach(post => {
          post.hasUpvoted = post.upvotes.some(id => id.toString() === req.user._id.toString());
          post.hasDownvoted = post.downvotes.some(id => id.toString() === req.user._id.toString());
          delete post.upvotes;
          delete post.downvotes;
        });
      }

      const postsCount = await Post.countDocuments(postFilter);
      
      results.posts = {
        data: posts,
        count: postsCount,
        pages: Math.ceil(postsCount / parseInt(limit))
      };
    }

    // Search Users
    if (type === 'all' || type === 'users') {
      const userFilter = {
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { bio: { $regex: searchQuery, $options: 'i' } }
        ],
        isActive: true
      };

      const users = await User.find(userFilter)
        .select('username avatar bio reputation stats createdAt')
        .sort({ reputation: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const usersCount = await User.countDocuments(userFilter);
      
      results.users = {
        data: users,
        count: usersCount,
        pages: Math.ceil(usersCount / parseInt(limit))
      };
    }

    // Search Teams
    if (type === 'all' || type === 'teams') {
      const teamFilter = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } }
        ]
      };

      const teams = await Team.find(teamFilter)
        .select('name description tags members maxMembers isOpen createdAt creator')
        .populate('creator', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Add member count and join status
      teams.forEach(team => {
        team.memberCount = team.members.length;
        team.isJoined = req.user ? 
          team.members.some(member => member.user.toString() === req.user._id.toString()) : 
          false;
      });

      const teamsCount = await Team.countDocuments(teamFilter);
      
      results.teams = {
        data: teams,
        count: teamsCount,
        pages: Math.ceil(teamsCount / parseInt(limit))
      };
    }

    // Search Comments (if specific search)
    if (type === 'comments') {
      const commentFilter = {
        $text: { $search: searchQuery },
        isDeleted: false
      };

      const comments = await Comment.find(commentFilter)
        .select('content author post createdAt upvotes downvotes')
        .populate('author', 'username avatar')
        .populate('post', 'title')
        .sort(buildSort(sortBy))
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const commentsCount = await Comment.countDocuments(commentFilter);
      
      results.comments = {
        data: comments,
        count: commentsCount,
        pages: Math.ceil(commentsCount / parseInt(limit))
      };
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, result) => sum + result.count, 0);

    res.json({
      success: true,
      data: {
        query: searchQuery,
        type,
        totalResults,
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    // Get popular posts that match
    const postSuggestions = await Post.find({
      title: { $regex: query, $options: 'i' },
      isArchived: false
    })
      .select('title')
      .sort({ views: -1 })
      .limit(5)
      .lean();

    // Get popular tags that match
    const tagSuggestions = await Post.aggregate([
      { $unwind: '$tags' },
      { $match: { tags: { $regex: query, $options: 'i' } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get users that match
    const userSuggestions = await User.find({
      username: { $regex: query, $options: 'i' },
      isActive: true
    })
      .select('username')
      .sort({ reputation: -1 })
      .limit(3)
      .lean();

    const suggestions = [
      ...postSuggestions.map(post => ({ type: 'post', text: post.title })),
      ...tagSuggestions.map(tag => ({ type: 'tag', text: tag._id })),
      ...userSuggestions.map(user => ({ type: 'user', text: user.username }))
    ];

    res.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/search/trending
// @desc    Get trending tags and topics
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    // Get trending tags from recent posts
    const trendingTags = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          isArchived: false
        }
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get popular posts from last week
    const trendingPosts = await Post.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      isArchived: false
    })
      .select('title views upvotes downvotes')
      .sort({ views: -1, 'upvotes.length': -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        trendingTags: trendingTags.map(tag => ({ name: tag._id, count: tag.count })),
        trendingPosts
      }
    });

  } catch (error) {
    console.error('Trending search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
