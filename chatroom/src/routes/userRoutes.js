// src/routes/userRoutes.js (create this file if it doesn't exist)
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// Route to ban a user (admin only)
router.post('/ban', authController.isAdmin, userController.banUser);

// Route to delete a message (admin only)
router.delete('/message/:id', authController.isAdmin, userController.deleteMessage);

module.exports = router;