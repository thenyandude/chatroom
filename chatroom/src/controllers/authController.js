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
    res.status(500).send('Error registering user');
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).send('Error logging in');
  }
};
