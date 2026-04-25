const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = require('../middleware/authMiddleware');

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('REGISTRATION FAILED: Email already exists -', email);
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword
    });
    
    await user.save();

    // Create token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('REGISTRATION SUCCESS:', user._id, email);
    res.status(201).json({ token, user: { _id: user._id, firstName, lastName, email, profile: user.profile, roadmap: user.roadmap, confidenceScore: user.confidenceScore } });
  } catch (error) {
    console.error("REGISTRATION CAUGHT ERROR:", error.name, error.message, error.stack);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    // Create token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, profile: user.profile, roadmap: user.roadmap, confidenceScore: user.confidenceScore, streakCount: user.streakCount } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
