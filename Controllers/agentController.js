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

// Agent 1: Clarifier
exports.runClarifier = async (req, res) => {
  try {
    const { userIdea } = req.body;
    if (!userIdea) {
      return res.status(400).json({ message: 'User idea is required.' });
    }

    const clarifierOutput = await runClarifierAgent(userIdea);
    
    // Create a new session and save the clarifier output
    const session = new Session({
      userIdea,
      clarifierOutput,
      status: 'clarified'
    });
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      clarifierOutput
    });

  } catch (error) {
    console.error('Error running Clarifier Agent:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Agent 2: Conflict Resolver
exports.runConflictResolver = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await getSession(sessionId, res);
    if (!session) return;

    const draftRequirements = session.clarifierOutput.draftRequirements;
    if (!draftRequirements) {
      return res.status(400).json({ message: 'Clarifier output missing in session.' });
    }

    const conflictOutput = await runConflictResolverAgent(draftRequirements);
    session.conflictOutput = conflictOutput;
    session.status = 'conflicts_identified';
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      conflictOutput
    });

  } catch (error) {
    console.error('Error running Conflict Resolver Agent:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Agent 3: Validator
exports.runValidator = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await getSession(sessionId, res);
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
    const { sessionId } = req.body;
    const session = await getSession(sessionId, res);
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
  const genAI = new GoogleGenerativeAI(process.env.CLARIFIER_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text);
}

async function runConflictResolverAgent(draftRequirements) {
  const genAI = new GoogleGenerativeAI(process.env.CONFLICT_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text);
}

async function runValidatorAgent(draftRequirements, conflicts) {
  const genAI = new GoogleGenerativeAI(process.env.VALIDATOR_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text);
}

async function runPrioritizerAgent(feasibilityReport) {
  const genAI = new GoogleGenerativeAI(process.env.PRIORITIZER_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text);
}
