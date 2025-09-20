const Session = require('../Model/sessionModel');
const User = require('../Model/userModel'); 
// POST /api/session/start
exports.startSession = async (req, res) => {
  try {
    const { userIdea, userId } = req.body; 
    if (!userIdea || !userId) {
      return res.status(400).json({ message: 'User idea and User ID are required.' });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Create a new session and link it to the user
    const newSession = new Session({ userIdea, userId });
    await newSession.save();

    res.status(201).json({
      sessionId: newSession._id,
      status: 'started',
      message: 'Session created. Next: run clarifier agent.',
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/session/:id/blueprint
exports.getBlueprint = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Validate the session ID
    if (!id) {
        return res.status(400).json({ message: 'Session ID is required in the URL.' });
    }

    // 2. Find the session document by its ID
    const session = await Session.findById(id);

    // 3. Handle case where the session is not found
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // 4. Check if the session is complete
    if (session.status !== 'prioritized' && session.status !== 'complete') {
        return res.status(400).json({ message: 'Blueprint is not ready. Please run all agents first.' });
    }

    // 5. Compile the final blueprint document
    const blueprint = {
      projectName: session.userIdea,
      problemStatement: '...', // This could be a generated statement from an agent
      requirements: session.clarifierOutput.draftRequirements || {},
      conflictsResolved: session.conflictOutput.conflicts || [],
      feasibilityReport: session.validatorOutput.feasibilityReport || {},
      roadmap: session.prioritizerOutput || {},
      status: session.status,
      createdAt: session.createdAt,
      lastUpdated: session.updatedAt,
    };

    // 6. Send the blueprint as a JSON response
    res.status(200).json(blueprint);
  } catch (error) {
    console.error('Error getting blueprint:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};