const express = require('express');
const router = express.Router();
const { summarizeSession } = require('../Controller/summarizerController');

// GET /api/summarize/:id
router.get('/:id', summarizeSession);

module.exports = router;
