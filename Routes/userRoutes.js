const express = require('express');
const router = express.Router();
const userController = require("../Controllers/userController");
const authMiddleware = require('../Middleware/authMiddleware'); // Import the authentication middleware

// Route to register a new user
router.post('/register', userController.createUser);

// Route to log in an existing user
router.post('/login', userController.loginUser);

// Route to get a user by ID. 
// The 'authMiddleware' is used here to protect this route.
// Only requests with a valid JWT will be allowed to proceed.
router.get('/:id', authMiddleware, userController.getUserById);

module.exports = router;