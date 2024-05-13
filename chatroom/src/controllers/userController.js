// src/controllers/userController.js
const User = require('../models/userModel');
const Message = require('../models/messageModel');

// Function to ban a user
exports.banUser = async (req, res) => {
  try {
    const { username } = req.body;
    const updatedUser = await User.findOneAndUpdate({ username }, { isBanned: true }, { new: true });
    if (!updatedUser) {
      return res.status(404).send('User not found');
    }
    res.status(200).send(`User ${username} banned.`);
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).send('Error banning user');
  }
};


// Function to delete a message (admin)
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const message = await Message.findById(messageId);

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
    const { profilePicture, usernameColor, pronouns, description } = req.body;
    const userId = req.user.id;  // Ensure req.user is properly set by your authentication middleware

    const updatedUser = await User.findByIdAndUpdate(userId, {
      profilePicture,
      usernameColor,
      pronouns,
      description
    }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also update the messages if needed, or you can decide to keep them as they were when created
    res.status(200).json({
      message: 'Settings updated successfully',
      data: updatedUser
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
    const user = await User.findOne({ username }, 'profilePicture usernameColor pronouns description -_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user settings' });
  }
};
