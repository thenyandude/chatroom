// src/controllers/userController.js
const User = require('../models/userModel');
const Message = require('../models/messageModel');

// Function to ban a user
exports.banUser = async (req, res) => {
  try {
    const { username } = req.body;
    // Logic to ban the user, like updating a 'banned' field in the user model
    res.status(200).send(`User ${username} banned.`);
    await User.updateOne({ username }, { isBanned: true });
  } catch (error) {
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
    const { profilePicture, usernameColor, description, pronouns } = req.body;
    const userId = req.user.id;

    // Find the user in the database by id
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's settings
    user.profilePicture = profilePicture;
    user.usernameColor = usernameColor;
    user.description = description;
    user.pronouns = pronouns;

    // Save the updated user
    await user.save();

    // Now update all past messages of this user
    await Message.updateMany(
      { user: user.username },  // Assuming 'user' in Message refers to username
      { 
        userProfilePicture: profilePicture,
        usernameColor: usernameColor 
      }
    );

    res.status(200).json({
      message: 'Settings updated successfully',
      profilePicture: user.profilePicture,
      usernameColor: user.usernameColor,
      description: user.description,
      pronouns: user.pronouns
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
    const user = await User.findOne({ username: username }, 'profilePicture usernameColor description pronouns -_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user settings' });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }, 'profilePicture description pronouns -_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

// Function to update user profile
exports.updateProfile = async (req, res) => {
  const { username } = req.params; // Get username from URL parameters
  const { description, pronouns } = req.body;
  
  const user = await User.findOne({ username });
  if (!user) {
      return res.status(404).send({ message: 'User not found' });
  }

  user.description = description || user.description;
  user.pronouns = pronouns || user.pronouns;

  await user.save();

  res.status(200).json({
      message: 'Profile updated successfully',
      data: {
          username: user.username,
          description: user.description,
          pronouns: user.pronouns
      }
  });
};

