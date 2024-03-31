// src/models/messageModel.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: String,
  userProfilePicture: String,
  usernameColor: String,
  text: String,
  room: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isEdited: { type: Boolean, default: false },
  editedBy: String
});

module.exports = mongoose.model('Message', messageSchema, 'chats');

