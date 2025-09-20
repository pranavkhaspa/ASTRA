const User = require('../Model/userModel');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For creating and verifying tokens

// POST /api/users/register
// Create a new user (Registration) with password hashing
exports.createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input, now including password
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash the password before saving it to the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user document with the hashed password
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword // Store the hashed password
    });
    await newUser.save();

    // Create and sign a JWT to send back to the client
    const token = jwt.sign(
      { userId: newUser._id }, 
      process.env.JWT_SECRET || 'your-secret-key', // Use a secure secret from environment variables
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'User created successfully.',
      userId: newUser._id,
      token
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/users/:id
// Find a user by their ID (Protected route)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password'); // Exclude password from the response

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/users/login
// Log in a user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find the user by their email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Create and sign a JWT for the authenticated user
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Logged in successfully.',
      token,
      userId: user._id
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};