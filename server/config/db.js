const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codecircle', {
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('📝 Note: Make sure MongoDB is installed and running');
    console.log('📝 Install: brew tap mongodb/brew && brew install mongodb-community');
    console.log('📝 Start: brew services start mongodb/brew/mongodb-community');
    console.log('⚠️ Server will continue without database connection...');
    
    // Try to reconnect after 5 seconds
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect to MongoDB...');
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;