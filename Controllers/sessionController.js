const mongoose = require('mongoose');
const Session = require('../Model/sessionModel');
const User = require('../Model/userModel');

// ✅ POST /api/session/start
exports.startSession = async (req, res) => {
  try {
    const { userIdea, userId } = req.body;

    // 1. Validate inputs
    if (!userIdea || !userId) {
      return res
        .status(400)
        .json({ message: 'User idea and User ID are required.' });
    }

    // 2. Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    // 3. Verify user existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 4. Create and save a new session
    const newSession = new Session({
      userIdea,
      userId,
      status: 'started', // default status
    });

    await newSession.save();

    // 5. Send response
    return res.status(201).json({
      sessionId: newSession._id,
      status: newSession.status,
      message: 'Session created successfully. Next: run clarifier agent.',
    });
  } catch (error) {
    console.error('Error starting session:', error);

    // Handle Mongo duplicate errors or other specific cases
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: 'Duplicate key error. Session already exists.' });
    }

    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ✅ GET /api/session/:id/blueprint
exports.getBlueprint = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate session ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: 'A valid Session ID is required in the URL.' });
    }

    // 2. Find the session
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // 3. Ensure session is in the right state
    if (session.status !== 'prioritized' && session.status !== 'complete') {
      return res.status(400).json({
        message: 'Blueprint is not ready. Please run all agents first.',
      });
    }

    // 4. Compile blueprint safely
    const blueprint = {
      projectName: session.userIdea,
      problemStatement: '...', // placeholder until agent fills in
      requirements: session.clarifierOutput?.draftRequirements || {},
      conflictsResolved: session.conflictOutput?.conflicts || [],
      feasibilityReport: session.validatorOutput?.feasibilityReport || {},
      roadmap: session.prioritizerOutput || {},
      status: session.status,
      createdAt: session.createdAt,
      lastUpdated: session.updatedAt,
    };

    // 5. Send response
    return res.status(200).json(blueprint);
  } catch (error) {
    console.error('Error getting blueprint:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
