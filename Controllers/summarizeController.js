const mongoose = require('mongoose');
const Session = require('../Model/sessionModel');

// ✅ GET /api/session/:id/summarize
exports.summarizeSession = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate session ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'A valid Session ID is required.' });
    }

    // 2. Find the session
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // 3. Compile detailed summary
    const summary = {
      sessionId: session._id,
      userId: session.userId,
      projectIdea: session.userIdea,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      clarifier: {
        questions: session.clarifierOutput?.questions || [],
        draftRequirements: session.clarifierOutput?.draftRequirements || {},
        userAnswers: session.clarifierAnswers || {},
      },
      conflicts: session.conflictOutput?.conflicts || [],
      validation: {
        feasibilityReport: session.validatorOutput?.feasibilityReport || {},
        riskLevel: session.validatorOutput?.riskLevel || 'Not assessed',
      },
      prioritization: session.prioritizerOutput || {},
    };

    // 4. Optional: create a final summary string (can later use AI if needed)
    summary.finalSummary = `
      Project Idea: ${summary.projectIdea}
      Status: ${summary.status}
      Feasibility: ${summary.validation.riskLevel}
      Number of Clarifier Questions: ${summary.clarifier.questions.length}
      Number of Conflicts Resolved: ${summary.conflicts.length}
      Must-Have Features: ${summary.prioritization.mustHave?.join(', ') || 'None'}
      Should-Have Features: ${summary.prioritization.shouldHave?.join(', ') || 'None'}
      Nice-to-Have Features: ${summary.prioritization.niceToHave?.join(', ') || 'None'}
    `;

    // 5. Send response
    return res.status(200).json(summary);

  } catch (error) {
    console.error('Error summarizing session:', error);
    return res.status(500).json({ message: 'Internal server error.', error });
  }
};
