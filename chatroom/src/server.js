// Import necessary libraries
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes and controllers
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes.js');
const authController = require('./controllers/authController');

// Import models
const Message = require('./models/messageModel');
const User = require('./models/userModel');

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost', // Update to match the domain you will make requests from
  credentials: true,
};
app.use(cors(corsOptions));

// Static files configuration
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect('mongodb://10.12.5.42:27017/chatroom', {
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// API Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/user', userRoutes);

// Registration endpoint
app.post('/register', authController.register);
// Login endpoint
app.post('/login', authController.login);

// Get all rooms
app.get('/rooms', async (req, res) => {
  const rooms = await Message.distinct('room');
  res.json(rooms);

  const defaultRooms = ['general', 'code', 'music', 'gaming'];
  defaultRooms.forEach(async (roomName) => {
    const exists = await Message.findOne({ room: roomName });
    if (!exists) {
      const initialMessage = new Message({
        user: "System",
        userProfilePicture: "system.png",
        usernameColor: "#00000",
        text: "Welcome to the " + roomName + " room!",
        room: roomName,
        timestamp: Date.now(),
      });
      await initialMessage.save();
    }
  });
});

// Create a room
app.post('/rooms', async (req, res) => {
  const { roomName } = req.body;
  res.status(201).json({ message: `Room ${roomName} created` });
});

// Admin code for deleting messages
app.delete('/messages/:id', async (req, res) => {
  const { id } = req.params;
  const { username, isAdmin } = req.body;
  const message = await Message.findById(id);
  if (!message) {
    return res.status(404).send('Message not found');
  }
  if (message.user === "System") {
    return res.status(403).send('Cannot delete system messages');
  }
  if (message.user === username || isAdmin) {
    const updatedMessage = await Message.findByIdAndUpdate(id, {
      user: "System",
      userProfilePicture: "system.png",
      usernameColor: "#00000",
      text: `Message deleted by ${username}`,
      room: message.room,
      timestamp: Date.now(),
      isDeleted: true
    }, { new: true });
    res.status(200).send('Message updated');
  } else {
    res.status(403).send('Unauthorized to delete this message');
  }
});

// Admin code for editing messages
app.put('/messages/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { text, username, isAdmin } = req.body;
  const message = await Message.findById(id);
  if (!message) {
    return res.status(404).send('Message not found');
  }
  if (message.user === username || isAdmin) {
    const updatedMessage = await Message.findByIdAndUpdate(id, {
      text: text,
      editedBy: username,
      isEdited: true
    }, { new: true });
    res.status(200).json(updatedMessage);
  } else {
    res.status(403).send('Unauthorized to edit this message');
  }
});

// Settings for profile pictures
app.get('/available-profile-pictures', (req, res) => {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const imageFiles = files.filter(file => file.endsWith('.png') && file !== 'system.png');
    res.json(imageFiles);
  });
});

// WebSocket server setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Mapping to keep track of each client's current room
const clientRooms = new Map();

wss.on('connection', (ws) => {
  clientRooms.set(ws, 'general'); // Default room
  ws.on('message', async (messageData) => {
    const data = JSON.parse(messageData);
    if (data.type === 'joinRoom') {
      clientRooms.set(ws, data.room);
      const roomMessages = await Message.find({ room: data.room }).sort({ timestamp: 1 });
      ws.send(JSON.stringify({ type: 'roomMessages', messages: roomMessages }));
    } else if (data.type === 'message') {
      const user = await User.findOne({ username: data.user });
      if (!user) {
        throw new Error('User not found');
      }
      const newMessage = new Message({
        user: user.username,
        userProfilePicture: user.profilePicture,
        usernameColor: user.usernameColor,
        text: data.text,
        room: clientRooms.get(ws),
      });
      await newMessage.save();
      const messageToSend = {
        ...newMessage.toObject(),
        userProfilePicture: user.profilePicture,
        usernameColor: user.usernameColor
      };
      wss.clients.forEach(client => {
        if (clientRooms.get(client) === clientRooms.get(ws) && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'newMessage', message: messageToSend }));
        }
      });
    }
  });
  ws.on('close', () => {
    clientRooms.delete(ws);
  });
});

server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});

module.exports = app;
