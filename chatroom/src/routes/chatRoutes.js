// src/routes/chatRoutes.js
const express = require('express');
const chatController = require('../controllers/chatController');
const authController = require('../controllers/authController');

const router = express.Router();

// Route to get all messages
router.get('/messages', authController.protect, chatController.getAllMessages);

// Route to get all rooms
router.get('/rooms', authController.protect, chatController.getAllRooms);

// Route to edit a message
router.put('/messages/edit/:id', authController.protect, chatController.editMessage);

// Route to delete a message
router.delete('/messages/:id', authController.protect, chatController.deleteMessage);

module.exports = router;
