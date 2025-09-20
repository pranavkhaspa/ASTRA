const express = require('express');
const router = express.Router();
const agentsController = require('../Controllers/agentController');

// POST /api/agents/clarifier
// Route to run the Clarifier Agent
router.post('/clarifier', agentsController.runClarifier);

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