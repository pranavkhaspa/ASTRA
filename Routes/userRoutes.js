const express = require('express');
const router = express.Router();
const userController = require("../Controllers/userController");

// Route to create a new user
router.post('/', userController.createUser);

// Route to get a user by ID
router.get('/:id', userController.getUserById);

module.exports = router;