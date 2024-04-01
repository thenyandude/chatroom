// src/controllers/userController.js
const User = require('../models/userModel');
const GeneralChat = require('../models/messageModel');

// Function to ban a user
exports.banUser = async (req, res) => {
  try {
    const { username } = req.body;
    // Logic to ban the user, like updating a 'banned' field in the user model
    res.status(200).send(`User ${username} banned.`);
  } catch (error) {
    res.status(500).send('Error banning user');
  }
};

// Function to delete a message (admin)
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const message = await GeneralChat.findById(messageId);

    // If the message doesn't exist or the user isn't the author and isn't an admin, deny access.
    if (!message) {
      return res.status(404).send('Message not found');
    }

    const requestingUser = req.user; // Assuming `req.user` is set from the `protect` middleware

    if (message.user.toString() !== requestingUser.id && !requestingUser.isAdmin) {
      return res.status(403).send('Not authorized to delete this message');
    }

    await message.remove();
    res.status(200).send('Message deleted');
  } catch (error) {
    res.status(500).send('Error deleting message');
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { profilePicture, usernameColor } = req.body;

    // Find the user in the database by id instead of username
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's settings
    user.profilePicture = profilePicture;
    user.usernameColor = usernameColor;

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: 'Settings updated successfully',
      profilePicture: user.profilePicture,
      usernameColor: user.usernameColor
    });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};


// src/controllers/userController.js
exports.getSettings = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username: username }, 'profilePicture usernameColor -_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user settings' });
  }
};




