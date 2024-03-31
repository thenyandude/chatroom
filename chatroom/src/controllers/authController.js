const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (user) => {
  try {
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
      expiresIn: '1d', // Token expires in 1 day
    });
    console.log('Generated token:', token); // Log the generated token
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Error generating token');
  }
};


// User Registration
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered',
      token,
      username: user.username,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// User Login
// User Login
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

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      username: user.username,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};



// Admin Check Middleware
exports.isAdmin = async (req, res, next) => {
  // Assuming user ID or username is stored in the request after authentication
  const user = await User.findById(req.user.id);
  if (user && user.isAdmin) {
    return next();
  }
  res.status(403).send("Access denied");
};

// Authentication Middleware
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Received token:', token); // Log the received token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Log the decoded token
      req.user = await User.findById(decoded.id).select('-password'); // Exclude password
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    console.error('No token received');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};


module.exports = {
  register: exports.register,
  login: exports.login,
  isAdmin: exports.isAdmin,
  protect: exports.protect
};
