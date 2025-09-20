const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI from your .env file
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully! 🚀');
  } catch (err) {
    // Log the error if the connection fails and exit the process
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;