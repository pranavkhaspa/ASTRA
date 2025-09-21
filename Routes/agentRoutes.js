const express = require('express');
const router = express.Router();
const agentsController = require('../Controllers/agentController');

// Start a session first
router.post('/start-session', agentsController.startSession);

// Clarifier Process
router.post('/clarifier/start', agentsController.startClarifierProcess);
router.post('/clarifier/submit-answers', agentsController.submitClarifierAnswers);

// **NEW Conflict Resolver Process (Two-Step)**
// 1. GET request to fetch the conflicts
router.get('/conflict-resolver', agentsController.getConflicts);
// 2. POST request to submit the user's chosen option
router.post('/conflict-resolver/resolve', agentsController.resolveConflict);

// Validator Agent
router.post('/validator', agentsController.runValidator);

// Prioritizer Agent
router.post('/prioritizer', agentsController.runPrioritizer);

module.exports = router;