// src/controllers/userController.js
const User = require('../models/userModel');
const Message = require('../models/messageModel');

// Function to ban a user
exports.banUser = async (req, res) => {
  try {
    const { username } = req.body;
    console.log(`Banning user: ${username}`); // Debug line
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found');
    }

    await User.updateOne({ username }, { isBanned: true });
    res.status(200).send(`User ${username} banned.`);
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).send('Error banning user');
  }
};



// Function to delete a message (admin)
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).send('Message not found');
    }

    const requestingUser = req.user;

    if (message.user !== requestingUser.username && !requestingUser.isAdmin) {
      return res.status(403).send('Not authorized to delete this message');
    }

    await message.remove();
    res.status(200).send('Message deleted');
  } catch (error) {
    res.status(500).send('Error deleting message');
  }
};

// Other user controller functions...

exports.getSettings = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }, 'profilePicture usernameColor description pronouns -_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { profilePicture, usernameColor, description, pronouns } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profilePicture = profilePicture;
    user.usernameColor = usernameColor;
    user.description = description;
    user.pronouns = pronouns;

    await user.save();

    await Message.updateMany(
      { user: user.username },
      { userProfilePicture: profilePicture, usernameColor: usernameColor }
    );

    res.status(200).json({
      message: 'Settings updated successfully',
      profilePicture: user.profilePicture,
      usernameColor: user.usernameColor,
      description: user.description,
      pronouns: user.pronouns
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
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

exports.updateProfile = async (req, res) => {
  const { username } = req.params;
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
