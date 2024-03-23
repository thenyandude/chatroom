// src/controllers/chatController.js
const Message = require('../models/messageModel');

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error getting messages', error });
  }
};