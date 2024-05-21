// src/controllers/chatController.js
const Message = require('../models/messageModel');
const User = require('../models/userModel');

const defaultRooms = ['general', 'code', 'music', 'gaming'];

const ensureDefaultRoomsExist = async () => {
  for (const roomName of defaultRooms) {
    const exists = await Message.findOne({ room: roomName });
    if (!exists) {
      const initialMessage = new Message({
        user: "System",
        userProfilePicture: "system.png",
        usernameColor: "#000000",
        text: `Welcome to the ${roomName} room!`,
        room: roomName,
        timestamp: Date.now(),
      });
      await initialMessage.save();
    }
  }
};

// Get all messages
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

// Update user settings
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

// Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    await ensureDefaultRoomsExist(); // Ensure default rooms exist before fetching
    const rooms = await Message.distinct('room');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error getting rooms', error });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, username, isAdmin } = req.body;

    // Find the message to be edited
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).send('Message not found');
    }

    // Check if the user is the author of the message or an admin
    if (message.user !== username && !isAdmin) {
      return res.status(403).send('Not authorized to edit this message');
    }

    // Update the message
    message.text = text;
    message.isEdited = true;
    message.editedBy = username;
    const updatedMessage = await message.save();

    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).send('Error editing message');
  }
};

// Delete a message

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    // If the message doesn't exist
    if (!message) {
      console.log('Message not found:', id);
      return res.status(404).send('Message not found');
    }

    // Assuming `req.user` is set from the `authController.protect` middleware
    const requestingUser = req.user;
    console.log('Requesting User:', requestingUser);
    console.log('Message User:', message.user);

    // Check if the user is the author of the message or an admin
    if (message.user !== requestingUser.username && !requestingUser.isAdmin) {
      console.log('Not authorized to delete this message');
      return res.status(403).send('Not authorized to delete this message');
    }

    await Message.deleteOne({ _id: id }); // Use deleteOne instead of remove
    res.status(200).send('Message deleted');
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).send('Error deleting message');
  }
};


