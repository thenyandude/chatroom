const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// Route to ban a user (admin only)
router.post('/ban', authController.protect, authController.isAdmin, userController.banUser);

// Route to delete a message (admin only)
router.delete('/message/:id', authController.protect, userController.deleteMessage);

// Route to update user settings
router.put('/updateSettings', authController.protect, userController.updateSettings);

// Route to get user settings
router.get('/:username/settings', authController.protect, userController.getSettings);

// Route to get user profile
router.get('/:username/profile', authController.protect, userController.getProfile);

// Route to update user profile
router.put('/:username/updateProfile', authController.protect, userController.updateProfile);

module.exports = router;
