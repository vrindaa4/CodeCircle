const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'comment_reply',
      'post_upvote',
      'comment_upvote',
      'team_invitation',
      'team_join_request',
      'team_member_joined',
      'mention',
      'follow',
      'achievement'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  relatedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });

// Mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function({
  recipientId,
  senderId,
  type,
  title,
  message,
  relatedPost,
  relatedComment,
  relatedTeam,
  data = {}
}) {
  // Don't create notification if sender and recipient are the same
  if (recipientId.toString() === senderId.toString()) {
    return null;
  }

  try {
    const notification = await this.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      relatedPost,
      relatedComment,
      relatedTeam,
      data
    });

    await notification.populate('sender', 'username avatar');
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(
  userId, 
  { page = 1, limit = 20, unreadOnly = false } = {}
) {
  const filter = { recipient: userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const notifications = await this.find(filter)
    .populate('sender', 'username avatar')
    .populate('relatedPost', 'title')
    .populate('relatedTeam', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const totalCount = await this.countDocuments(filter);
  const unreadCount = await this.countDocuments({ 
    recipient: userId, 
    isRead: false 
  });

  return {
    notifications,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    },
    unreadCount
  };
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
