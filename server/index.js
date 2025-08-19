const http = require('http');
const path = require('path');

// --- Third-party Libraries ---
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Loads environment variables from a .env file

// --- Application-specific Imports ---
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');

// --- Initializations ---
const app = express();
const PORT = process.env.PORT || 5050;

// --- Database Connection ---
connectDB();

// --- Middleware ---

// Enable Cross-Origin Resource Sharing (CORS)
// This allows your frontend (running on a different port) to communicate with this backend.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
// This allows Express to read JSON data from request bodies.
app.use(express.json());

// --- API Routes ---
// All authentication-related routes will be prefixed with /api/auth
app.use('/api/auth', authRoutes);
// All post-related routes will be prefixed with /api/posts
app.use('/api/posts', postRoutes);
// All comment-related routes will be prefixed with /api/comments
app.use('/api/comments', commentRoutes);


// --- Health Check Endpoint ---
// A simple route to check if the server is running.
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// --- Global Error Handler ---
// This middleware catches any errors that occur in the route handlers.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'An unexpected error occurred on the server.'
  });
});

// --- 404 Not Found Handler ---
// This middleware catches any requests for routes that don't exist.
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'The requested resource was not found.' 
  });
});


// --- Server Startup ---
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});