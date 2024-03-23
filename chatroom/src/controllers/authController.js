// src/controllers/authController.js
const User = require('../models/userModel');

exports.register = async (req, res) => {
  try {
    let user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Here, you would generate a token or session
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};
