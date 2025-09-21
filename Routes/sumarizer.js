const express = require('express');
const router = express.Router();
const { summarizeSession } = require('../Controllers/summarizeController');

// GET /api/summarize/:id
router.get('/:id', summarizeSession);

module.exports = router;
