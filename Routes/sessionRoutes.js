const express = require('express');
const router = express.Router();
const sessionController = require('../Controllers/sessionController');

// POST /api/session/start
// Route to start a new requirement-gathering session
router.post('/start', sessionController.startSession);

// GET /api/session/:id/blueprint
// Route to get the final project blueprint document for a specific session
router.get('/:id/blueprint', sessionController.getBlueprint);

module.exports = router;