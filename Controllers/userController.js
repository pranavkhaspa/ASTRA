const User = require('../Model/userModel');

// POST /api/users/
// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Validate input
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required.' });
    }

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Create a new user document
    const newUser = new User({ username, email });
    await newUser.save();

    res.status(201).json({ 
      message: 'User created successfully.',
      userId: newUser._id,
      username: newUser.username
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/users/:id
// Find a user by their ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// You can add more controller functions here, such as:
// exports.updateUser = async (req, res) => { ... }
// exports.deleteUser = async (req, res) => { ... }