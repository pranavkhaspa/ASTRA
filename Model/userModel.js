const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // User's username
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  
  // User's email
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  // Timestamps for creation and last update
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);