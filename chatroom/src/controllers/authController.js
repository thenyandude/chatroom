// src/controllers/authController.js
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).send('User already exists');
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).send('User registered');
  } catch (error) {
    // Ensure only one response is sent back to the client
    console.error('Register error:', error);
    res.status(500).send('Error registering user');
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', isAdmin: user.isAdmin });  // Assuming isAdmin is a property of your User model
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};



exports.isAdmin = async (req, res, next) => {
  // Assume user ID or username is stored in the request after authentication
  const user = await User.findById(req.userId);
  if (user && user.isAdmin) {
    return next();
  }
  res.status(403).send("Access denied");
};
