const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor() {
    this.io = null;
    this.users = new Map(); // userId -> socketId mapping
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3001",
        methods: ["GET", "POST"]
      }
    });

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.username} connected`);
      
      // Store user-socket mapping
      this.users.set(socket.userId, socket.id);
      
      // Join user to their personal room for notifications
      socket.join(`user_${socket.userId}`);
      
      // Handle joining post/team rooms
      socket.on('join_post', (postId) => {
        socket.join(`post_${postId}`);
        console.log(`User ${socket.user.username} joined post ${postId}`);
      });

      socket.on('leave_post', (postId) => {
        socket.leave(`post_${postId}`);
        console.log(`User ${socket.user.username} left post ${postId}`);
      });

      socket.on('join_team', (teamId) => {
        socket.join(`team_${teamId}`);
        console.log(`User ${socket.user.username} joined team ${teamId}`);
      });

      socket.on('leave_team', (teamId) => {
        socket.leave(`team_${teamId}`);
        console.log(`User ${socket.user.username} left team ${teamId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(`post_${data.postId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          postId: data.postId
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(`post_${data.postId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          postId: data.postId
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected`);
        this.users.delete(socket.userId);
      });
    });

    return this.io;
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // Emit to post room
  emitToPost(postId, event, data) {
    this.io.to(`post_${postId}`).emit(event, data);
  }

  // Emit to team room
  emitToTeam(teamId, event, data) {
    this.io.to(`team_${teamId}`).emit(event, data);
  }

  // Emit new comment notification
  notifyNewComment(postId, comment, authorId) {
    this.emitToPost(postId, 'new_comment', {
      comment,
      authorId
    });
  }

  // Emit new post notification
  notifyNewPost(post) {
    this.io.emit('new_post', post);
  }

  // Emit team invitation
  notifyTeamInvitation(userId, team, invitedBy) {
    this.emitToUser(userId, 'team_invitation', {
      team,
      invitedBy
    });
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.users.has(userId);
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.users.size;
  }
}

module.exports = new SocketService();
