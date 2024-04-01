// src/controllers/chatController.js
const Message = require('../models/messageModel');
const User = require('../models/userModel'); // Import userModel

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    const userSettings = {}; // Cache for user settings

    for (let message of messages) {
      if (!userSettings[message.user]) {
        const user = await User.findOne({ username: message.user });
        if (user) {
          userSettings[message.user] = {
            userProfilePicture: user.profilePicture,
            usernameColor: user.usernameColor
          };
        }
      }

      message.userProfilePicture = userSettings[message.user]?.userProfilePicture;
      message.usernameColor = userSettings[message.user]?.usernameColor;
    }

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error getting messages', error });
  }
};


exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profilePicture, usernameColor } = req.body;

    // Fetch the user to get their username
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user document
    await User.findByIdAndUpdate(userId, { profilePicture, usernameColor });

    // Update all past messages of the user
    await Message.updateMany(
      { user: user.username }, // Assuming 'user' is the username
      { userProfilePicture: profilePicture, usernameColor: usernameColor }
    );

    res.json({ message: 'User settings updated successfully' });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Error updating user settings', error: error.message });
  }
};


