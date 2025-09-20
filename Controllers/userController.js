  const User = require('../Model/userModel');
  const bcrypt = require('bcryptjs'); 
  const jwt = require('jsonwebtoken'); 

  // POST /api/users/register
  // Create a new user (Registration) with password hashing
  exports.createUser = async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({ 
        username, 
        email, 
        password: hashedPassword
      });
      await newUser.save();

      // Create JWT
      const token = jwt.sign(
        { userId: newUser._id }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '1h' }
      );

      // Send JWT as cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // only over HTTPS in production
        sameSite: "none", // allow cross-origin requests
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.status(201).json({ 
        message: 'User created successfully.',
        userId: newUser._id
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };

  // GET /api/users/:id (Protected route)
  exports.getUserById = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-password');

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
  exports.loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      // Create JWT
      const token = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '1h' }
      );

      // ✅ Send JWT as HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 60 * 60 * 1000,
      });

      res.status(200).json({
        message: 'Logged in successfully.',
        userId: user._id
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
