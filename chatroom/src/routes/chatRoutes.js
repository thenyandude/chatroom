// src/routes/chatRoutes.js
const express = require('express');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/messages', chatController.getAllMessages);

module.exports = router;
