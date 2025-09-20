const express = require('express');
const router = express.Router();
const agentsController = require('../Controllers/agentController');

// NEW: Routes for the two-step Clarifier process
// POST /api/agents/clarifier/start
// Route to get the clarifying questions from the user's idea
router.post('/clarifier/start', agentsController.startClarifierProcess);

// POST /api/agents/clarifier/submit-answers
// Route to submit the user's answers to the clarifying questions
router.post('/clarifier/submit-answers', agentsController.submitClarifierAnswers);

// POST /api/agents/conflict-resolver
// Route to run the Conflict Resolver Agent
router.post('/conflict-resolver', agentsController.runConflictResolver);

// POST /api/agents/validator
// Route to run the Validator Agent
router.post('/validator', agentsController.runValidator);

// POST /api/agents/prioritizer
// Route to run the Prioritizer Agent
router.post('/prioritizer', agentsController.runPrioritizer);

module.exports = router;
