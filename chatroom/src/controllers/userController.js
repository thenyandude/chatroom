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
    await GeneralChat.findByIdAndRemove(messageId);
    res.status(200).send('Message deleted');
  } catch (error) {
    res.status(500).send('Error deleting message');
  }
};
