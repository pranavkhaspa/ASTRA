const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // Link the session to a specific user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This creates the link to the 'User' model
    required: true,
  },
  
  // The initial idea provided by the user
  userIdea: {
    type: String,
    required: true,
  },
  
  // Output from the Clarifier Agent
  clarifierOutput: {
    questions: [String],
    draftRequirements: mongoose.Schema.Types.Mixed,
  },
  
  // User's answers to the clarifying questions
  clarifierAnswers: mongoose.Schema.Types.Mixed,

  // Output from the Conflict Resolver Agent
  conflictOutput: {
    conflicts: [
      {
        issue: String,
        options: [String],
      }
    ],
  },
  
  // Output from the Validator Agent
  validatorOutput: {
    feasibilityReport: {
      technical: String,
      market: String,
      business: String,
    },
    riskLevel: String,
  },
  
  // Output from the Prioritizer Agent
  prioritizerOutput: {
    mustHave: [String],
    shouldHave: [String],
    niceToHave: [String],
  },

  // A field to track the current stage of the session
  status: {
    type: String,
    enum: ['started', 'clarified', 'answers_submitted', 'conflict_found', 'validated', 'prioritized', 'complete'],
    default: 'started',
  },
  
  // Timestamps for creation and last update
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Session', sessionSchema);