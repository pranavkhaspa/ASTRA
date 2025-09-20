const Session = require('../Model/sessionModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper function to handle common session retrieval logic
const getSession = async (sessionId, res) => {
  if (!sessionId) {
    res.status(400).json({ message: 'Session ID is required.' });
    return null;
  }
  const session = await Session.findById(sessionId);
  if (!session) {
    res.status(404).json({ message: 'Session not found.' });
    return null;
  }
  return session;
};

// POST /api/agents/clarifier
exports.runClarifier = async (req, res) => {
  try {
    const { sessionId, userIdea } = req.body;
    const session = await getSession(sessionId, res);
    if (!session) return;

    // Use a single environment variable for the API key, as it provides access to all models.
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // The prompt guides the model to act as a "Clarifier Agent"
    const prompt = `
      You are a "Clarifier Agent" for a software development team. Your goal is to take a high-level user idea and generate two things:
      1. A list of clarifying questions to ask the user to refine the idea.
      2. A first draft of requirements based on the initial idea.
      
      The questions should be specific and help uncover details about the target audience, core features, and unique selling points. The draft requirements should be a structured JSON object with keys like 'coreFeatures', 'aesthetics', and 'targetAudience'.
      
      User's idea: "${userIdea}"
      
      Please provide your response as a single, valid JSON object with the following structure:
      {
        "questions": ["Question 1", "Question 2", "Question 3"],
        "draftRequirements": {
          "coreFeatures": ["Feature A", "Feature B", "Feature C"],
          "aesthetics": "A brief description of the desired look and feel.",
          "targetAudience": "A description of the ideal user."
        }
      }
      `;

    // Make the API call to generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const clarifierOutput = JSON.parse(response.text);

    // Save the output to the session and update its status
    session.clarifierOutput = clarifierOutput;
    session.status = 'clarified';
    await session.save();

    res.status(200).json(clarifierOutput);
  } catch (error) {
    console.error('Error running clarifier agent:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/agents/conflict-resolver
exports.runConflictResolver = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await getSession(sessionId, res);
    if (!session) return;

    if (session.status !== 'clarified') {
      return res.status(400).json({ message: 'Clarifier agent must be run first.' });
    }

    // TODO: Integrate with Gemini API here
    // The prompt would analyze session.clarifierOutput to find contradictions.
    // Example: const prompt = `Analyze these requirements for contradictions: ${JSON.stringify(session.clarifierOutput.draftRequirements)}`;

    const mockOutput = {
      conflicts: [
        {
          issue: 'Minimalist design vs social media-like features (e.g., infinite scroll)',
          options: [
            "Keep minimalist: drop social feed",
            "Emphasize engagement: integrate 'reels' feature with a modified aesthetic"
          ],
        },
      ],
    };

    session.conflictOutput = mockOutput;
    session.status = 'resolved';
    await session.save();

    res.status(200).json(mockOutput);
  } catch (error) {
    console.error('Error running conflict resolver agent:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/agents/validator
exports.runValidator = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await getSession(sessionId, res);
    if (!session) return;

    if (session.status !== 'resolved') {
      return res.status(400).json({ message: 'Conflict resolver agent must be run first.' });
    }

    // TODO: Integrate with Gemini API here
    // The prompt would validate session.clarifierOutput and session.conflictOutput against feasibility checks.
    
    const mockOutput = {
      feasibilityReport: {
        technical: "Real-time inventory system is a high-complexity feature requiring dedicated infrastructure.",
        market: "Gamified shopping and social features are trending, which provides a good differentiator.",
        business: "The proposed features align well with the goal of high user retention.",
      },
      riskLevel: "medium",
    };

    session.validatorOutput = mockOutput;
    session.status = 'validated';
    await session.save();

    res.status(200).json(mockOutput);
  } catch (error) {
    console.error('Error running validator agent:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/agents/prioritizer
exports.runPrioritizer = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await getSession(sessionId, res);
    if (!session) return;

    if (session.status !== 'validated') {
      return res.status(400).json({ message: 'Validator agent must be run first.' });
    }

    // TODO: Integrate with Gemini API here
    // The prompt would categorize features from session.clarifierOutput based on impact and effort.
    
    const mockOutput = {
      mustHave: ['Product listings', 'Checkout system', 'User authentication'],
      shouldHave: ['User profiles', 'Rating system', 'Basic search functionality'],
      niceToHave: ['Loyalty program', 'Advanced analytics dashboard', 'AI-powered product recommendations'],
    };

    session.prioritizerOutput = mockOutput;
    session.status = 'prioritized';
    await session.save();

    res.status(200).json(mockOutput);
  } catch (error) {
    console.error('Error running prioritizer agent:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};