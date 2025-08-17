const express = require('express');
const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { sanitizeInput, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');
const socketService = require('../services/socketService');

const router = express.Router();

// Validation rules for team creation/update
const teamValidationRules = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Team name must be between 3 and 50 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Max members must be between 2 and 100')
];

// @route   GET /api/teams
// @desc    Get all teams with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sort = req.query.sort || '-createdAt';
    const search = req.query.search;
    const tag = req.query.tag;
    const isOpen = req.query.isOpen;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (tag) {
      filter.tags = tag.toLowerCase();
    }
    
    if (isOpen !== undefined) {
      filter.isOpen = isOpen === 'true';
    }

    const skip = (page - 1) * limit;

    const teams = await Team.find(filter)
      .populate('creator', 'username avatar reputation')
      .populate('members.user', 'username avatar reputation')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Add member count and current user's membership status
    teams.forEach(team => {
      team.memberCount = team.members.length;
      team.isJoined = req.user ? 
        team.members.some(member => member.user._id.toString() === req.user._id.toString()) : 
        false;
    });

    const totalTeams = await Team.countDocuments(filter);

    res.json({
      success: true,
      data: {
        teams,
        pagination: {
          page,
          limit,
          totalTeams,
          totalPages: Math.ceil(totalTeams / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/teams
// @desc    Create a new team
// @access  Private
router.post('/',
  protect,
  sanitizeInput,
  teamValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, tags, maxMembers, isOpen } = req.body;

      // Check if team name already exists
      const existingTeam = await Team.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'Team name already exists'
        });
      }

      // Create team
      const team = await Team.create({
        name,
        description,
        creator: req.user._id,
        tags: tags ? tags.map(tag => tag.toLowerCase()) : [],
        maxMembers: maxMembers || 10,
        isOpen: isOpen !== undefined ? isOpen : true,
        members: [{
          user: req.user._id,
          role: 'admin',
          joinedAt: new Date()
        }]
      });

      await team.populate('creator', 'username avatar reputation');
      await team.populate('members.user', 'username avatar reputation');

      // Update user stats
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.teamsJoined': 1 }
      });

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { team }
      });

    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/teams/:id
// @desc    Get team by ID with projects and members
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('creator', 'username avatar reputation')
      .populate('members.user', 'username avatar reputation bio')
      .populate('projects', 'title content category tags createdAt')
      .lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if current user is a member
    const isMember = req.user ? 
      team.members.some(member => member.user._id.toString() === req.user._id.toString()) : 
      false;

    team.isMember = isMember;
    team.memberCount = team.members.length;

    res.json({
      success: true,
      data: { team }
    });

  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/teams/:id/join
// @desc    Join a team
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if already a member
    const isAlreadyMember = team.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is full'
      });
    }

    // Check if team is open for joining
    if (!team.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'This team is not open for new members'
      });
    }

    // Add user to team
    team.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date()
    });

    await team.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.teamsJoined': 1 }
    });

    // Notify team creator
    await Notification.createNotification({
      recipientId: team.creator,
      senderId: req.user._id,
      type: 'team_member_joined',
      title: 'New Team Member',
      message: `${req.user.username} joined your team "${team.name}"`,
      relatedTeam: team._id
    });

    // Notify other team members via socket
    socketService.emitToTeam(team._id, 'member_joined', {
      user: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar
      },
      team: team._id
    });

    res.json({
      success: true,
      message: 'Successfully joined the team'
    });

  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/teams/:id/leave
// @desc    Leave a team
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    const memberIndex = team.members.findIndex(
      member => member.user.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // Prevent creator from leaving if there are other members
    if (team.creator.toString() === req.user._id.toString() && team.members.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Team creator cannot leave while there are other members. Transfer ownership first.'
      });
    }

    // Remove user from team
    team.members.splice(memberIndex, 1);
    await team.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.teamsJoined': -1 }
    });

    // If creator left and no members remain, delete the team
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(team._id);
    }

    res.json({
      success: true,
      message: 'Successfully left the team'
    });

  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/teams/user/:userId
// @desc    Get teams for a specific user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.params.userId
    })
      .populate('creator', 'username avatar')
      .select('name description tags memberCount createdAt')
      .lean();

    // Add member count
    teams.forEach(team => {
      team.memberCount = team.members ? team.members.length : 0;
    });

    res.json({
      success: true,
      data: { teams }
    });

  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
