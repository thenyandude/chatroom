const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// Route to ban a user (admin only)
router.post('/ban', authController.protect, authController.isAdmin, userController.banUser);

// Route to get user profile
router.get('/:username/profile', authController.protect, userController.getProfile);

// Route to update user settings
router.put('/updateSettings', authController.protect, userController.updateSettings);

// Other routes...
router.get('/:username/settings', authController.protect, userController.getSettings);
router.put('/:username/updateProfile', authController.protect, userController.updateProfile);

module.exports = router;
