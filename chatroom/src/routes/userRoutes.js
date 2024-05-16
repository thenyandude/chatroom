// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// Route to ban a user, which should be an admin only action
router.post('/ban', authController.protect, authController.isAdmin, userController.banUser);

// Route to delete a message, also an admin only action
router.delete('/message/:id', authController.protect, userController.deleteMessage);

// Route to update user settings, any authenticated user can access
router.put('/updateSettings', authController.protect, userController.updateSettings);

// Route to get user settings, any authenticated user can access
router.get('/getSettings', authController.protect, userController.getSettings);

// In userRoutes.js or a similar file
router.get('/:username/settings', authController.protect, userController.getSettings);

// Routes related to user profiles
router.get('/:username/profile', authController.protect, userController.getProfile);
router.put('/:username/updateProfile', authController.protect, userController.updateProfile);


module.exports = router;
