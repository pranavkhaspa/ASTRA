const Session = require('../Model/sessionModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper function to handle common session retrieval logic.
// This function will now correctly handle the sessionId passed in the request body, headers, or URL query.
const getSession = async (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.body.sessionId || req.query.sessionId; 
  
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

// Start a new session and get a session ID
exports.startSession = async (req, res) => {
  try {
    const { userId, userIdea } = req.body;
    if (!userId || !userIdea) {
      return res.status(400).json({ message: 'User ID and user idea are required to start a session.' });
    }

    const session = new Session({
      userId,
      userIdea,
      status: 'started'
    });
    await session.save();

    res.status(200).json({ sessionId: session._id, message: 'Session started successfully.' });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// NEW Agent 1: Start Clarifier (Step 1)
exports.startClarifierProcess = async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;
    
    if (!session.userIdea) {
      return res.status(400).json({ message: 'User idea not found in session. Please start a new session.' });
    }

    const clarifierOutput = await runClarifierAgent(session.userIdea);
    session.clarifierOutput = clarifierOutput;
    session.status = 'clarified';
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      questions: clarifierOutput.questions
    });

  } catch (error) {
    console.error('Error starting Clarifier Process:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// NEW Agent 1: Submit Answers (Step 2)
exports.submitClarifierAnswers = async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const { userAnswers } = req.body;
    if (!userAnswers) {
      return res.status(400).json({ message: 'User answers are required.' });
    }

    session.clarifierAnswers = userAnswers;
    session.status = 'answers_submitted';
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      message: 'Answers submitted successfully.'
    });

  } catch (error) {
    console.error('Error submitting Clarifier answers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// **NEW Agent 2: Get Conflicts (Step 1)**
// This GET request will run the conflict resolver and return the conflicts for the user to see.
exports.getConflicts = async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    // Check if the clarifier has run
    const draftRequirements = session.clarifierOutput.draftRequirements;
    if (!draftRequirements) {
      return res.status(400).json({ message: 'Clarifier output missing in session. Please complete clarification first.' });
    }

    // Run the agent and save the output to the session
    const conflictOutput = await runConflictResolverAgent(draftRequirements);
    session.conflictOutput = conflictOutput;
    session.status = 'conflict_found';
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      conflicts: conflictOutput.conflicts
    });

  } catch (error) {
    console.error('Error getting conflicts:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// **NEW Agent 2: Resolve Conflict (Step 2)**
// This POST request will take the user's choice and update the session.
exports.resolveConflict = async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const { chosenOptionIndex } = req.body;
    if (chosenOptionIndex === undefined) {
      return res.status(400).json({ message: 'Chosen option is required.' });
    }

    // This is where you would apply the chosen resolution to the draft requirements
    // For this example, we'll just save the user's choice.
    session.conflictResolution = {
      chosenOption: chosenOptionIndex,
      originalConflicts: session.conflictOutput.conflicts,
      // You can add more logic here to modify the requirements based on the choice
    };
    session.status = 'resolved';
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      message: 'Conflict resolved successfully. Session status updated.'
    });

  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Agent 3: Validator
exports.runValidator = async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const draftRequirements = session.clarifierOutput.draftRequirements;
    const conflicts = session.conflictOutput.conflicts;
    
    if (!draftRequirements || !conflicts) {
      return res.status(400).json({ message: 'Clarifier or Conflict Resolver output missing in session.' });
    }

    const validatorOutput = await runValidatorAgent(draftRequirements, conflicts);
    session.validatorOutput = validatorOutput;
    session.status = 'validated';
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      validatorOutput
    });

  } catch (error) {
    console.error('Error running Validator Agent:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Agent 4: Prioritizer
exports.runPrioritizer = async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const feasibilityReport = session.validatorOutput.feasibilityReport;
    if (!feasibilityReport) {
      return res.status(400).json({ message: 'Validator output missing in session.' });
    }

    const finalOutput = await runPrioritizerAgent(feasibilityReport);
    session.prioritizerOutput = finalOutput;
    session.status = 'prioritized';
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      finalOutput
    });

  } catch (error) {
    console.error('Error running Prioritizer Agent:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Internal Agent Functions (kept separate for clarity)
async function runClarifierAgent(userIdea) {
  console.log('--- Running Clarifier Agent ---');
  const genAI = new GoogleGenerativeAI(process.env.CLARIFIER_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `
    You are a "Clarifier Agent" for a software development team. Your goal is to conduct a simulated interview to transform a high-level, ambiguous user idea into a detailed, concrete set of requirements.
    
    You must generate two things:
    1. A list of 3-5 specific, clarifying questions that would be asked in an interview with the user. These questions should probe for details about the target audience, core value proposition, aesthetic, and unique features.
    2. A first draft of the requirements based on the initial user idea. This should be a structured JSON object.
    
    User's idea: "${userIdea}"
    
    The output must be a single, valid JSON object with the following keys and structure:
    {
      "questions": ["Question 1 about target demographic", "Question 2 about core value proposition", "Question 3 about aesthetics", "Question 4 about key features"],
      "draftRequirements": {
        "coreFeatures": ["Feature A", "Feature B", "Feature C"],
        "aesthetics": "A brief, descriptive summary of the desired look and feel.",
        "targetAudience": "A precise description of the ideal user or market segment."
      }
    }
  `;
  console.log('Clarifier Prompt:', prompt);
  
  const result = await model.generateContent(prompt);

  const text = typeof result.response.text === 'function' 
    ? await result.response.text() 
    : result.response.text;
  
  console.log('Raw Clarifier API Response:', text);
  
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    } else {
      return JSON.parse(text);
    }
  } catch (e) {
    console.error('Failed to parse JSON from Clarifier response:', e);
    throw new Error('Invalid JSON format from AI agent.');
  }
}

async function runConflictResolverAgent(draftRequirements) {
  console.log('--- Running Conflict Resolver Agent ---');
  const genAI = new GoogleGenerativeAI(process.env.CONFLICT_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `
    You are a "Conflict Resolver Agent". Your task is to analyze a set of draft software requirements and identify any logical inconsistencies or contradictions.
    
    Analyze the following draft requirements and identify potential conflicts. For each conflict, you must:
    1. Describe the issue clearly.
    2. Propose 2-3 specific options to resolve the trade-off. These options should act as prompts for the user to make a decision.
    
    The requirements to analyze are:
    ${JSON.stringify(draftRequirements, null, 2)}
    
    The output must be a single, valid JSON object with the following structure. If no conflicts are found, the "conflicts" array should be empty.
    {
      "conflicts": [
        {
          "issue": "A clear description of the logical contradiction.",
          "options": ["Option 1 to resolve the conflict.", "Option 2 to resolve the conflict."]
        }
      ]
    }
  `;
  console.log('Conflict Resolver Prompt:', prompt);

  const result = await model.generateContent(prompt);
  
  const text = typeof result.response.text === 'function' 
    ? await result.response.text() 
    : result.response.text;
  
  console.log('Raw Conflict Resolver API Response:', text);
  
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    } else {
      return JSON.parse(text);
    }
  } catch (e) {
    console.error('Failed to parse JSON in Conflict Resolver:', e);
    throw new Error('Invalid JSON format from AI agent.');
  }
}

async function runValidatorAgent(draftRequirements, conflicts) {
  console.log('--- Running Validator Agent ---');
  const genAI = new GoogleGenerativeAI(process.env.VALIDATOR_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `
    You are a "Validator Agent". Your role is to assess the feasibility and viability of a set of software requirements and any identified conflicts.
    
    Perform the following checks:
    - Technical Feasibility: Cross-reference the proposed features against common development challenges and technological limitations.
    - Market Viability: Analyze the competitive landscape and evaluate if the features provide a unique edge or are standard for the market.
    - Business Objectives: Ensure the requirements align with the original business goals, such as user retention or high revenue.
    
    Based on your analysis, provide a detailed report and assign a risk level.
    
    Requirements to validate: ${JSON.stringify(draftRequirements, null, 2)}
    Identified conflicts: ${JSON.stringify(conflicts, null, 2)}
    
    The output must be a single, valid JSON object with the following structure:
    {
      "feasibilityReport": {
        "technical": "A detailed analysis of technical complexity and challenges.",
        "market": "An assessment of market viability and competitive edge.",
        "business": "An evaluation of how the features align with business goals."
      },
      "riskLevel": "low" | "medium" | "high"
    }
  `;
  console.log('Validator Prompt:', prompt);

  const result = await model.generateContent(prompt);
  
  const text = typeof result.response.text === 'function' 
    ? await result.response.text() 
    : result.response.text;
  
  console.log('Raw Validator API Response:', text);
  
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    } else {
      return JSON.parse(text);
    }
  } catch (e) {
    console.error('Failed to parse JSON in Validator:', e);
    throw new Error('Invalid JSON format from AI agent.');
  }
}

async function runPrioritizerAgent(feasibilityReport) {
  console.log('--- Running Prioritizer Agent ---');
  const genAI = new GoogleGenerativeAI(process.env.PRIORITIZER_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `
    You are a "Prioritizer Agent". Your job is to create a structured, prioritized roadmap based on a feasibility report.
    
    Categorize all features mentioned in the report into three groups:
    - "mustHave": Features essential for a Minimum Viable Product (MVP).
    - "shouldHave": Features that add significant value and should be included after the MVP.
    - "niceToHave": Features that can be added in future iterations if resources allow.
    
    Use the provided feasibility report to inform your prioritization, considering factors like effort and impact.
    
    Feasibility Report: ${JSON.stringify(feasibilityReport, null, 2)}
    
    The output must be a single, valid JSON object with the following structure:
    {
      "mustHave": ["Feature 1", "Feature 2"],
      "shouldHave": ["Feature A", "Feature B"],
      "niceToHave": ["Feature X", "Feature Y"]
    }
  `;
  console.log('Prioritizer Prompt:', prompt);

  const result = await model.generateContent(prompt);
  
  const text = typeof result.response.text === 'function' 
    ? await result.response.text() 
    : result.response.text;
  
  console.log('Raw Prioritizer API Response:', text);
  
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    } else {
      return JSON.parse(text);
    }
  } catch (e) {
    console.error('Failed to parse JSON in Prioritizer:', e);
    throw new Error('Invalid JSON format from AI agent.');
  }
}