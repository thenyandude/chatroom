// src/server.js
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

const Message = require('./models/messageModel');
const User = require('./models/userModel');

const authController = require('./controllers/authController');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect('mongodb://10.12.5.42:27017/chatroom', {
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// Use the auth, chat, and user routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/user', userRoutes);

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
      // Update the client's current room
      clientRooms.set(ws, data.room);

      // Fetch and send all messages from the joined room
      const roomMessages = await Message.find({ room: data.room }).sort({ timestamp: 1 });
      ws.send(JSON.stringify({ type: 'roomMessages', messages: roomMessages }));
    } else if (data.type === 'message') {
      // Create a new message in the current room
      try {
        const user = await User.findOne({ username: data.user }); // Find the user by username
        if (!user) {
          throw new Error('User not found');
        }

        const newMessage = new Message({
          user: user.username,
          userProfilePicture: user.profilePicture, // Assuming these fields exist on the User model
          usernameColor: user.usernameColor,
          text: data.text,
          room: clientRooms.get(ws),
        });

        await newMessage.save();

        // Prepare the message to send, including the user's picture and color
        const messageToSend = {
          ...newMessage.toObject(),
          userProfilePicture: user.profilePicture,
          usernameColor: user.usernameColor
        };

        // Broadcast the new message to all clients in the same room
        wss.clients.forEach(client => {
          if (clientRooms.get(client) === clientRooms.get(ws) && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'newMessage', message: messageToSend }));
          }
        });

      } catch (error) {
        console.error('Error handling message event:', error);
        // Handle errors, e.g., send a message back to the client
      }
    }
  });

  ws.on('close', () => {
    clientRooms.delete(ws); // Remove the client from the tracking map
    console.log('Client disconnected');
  });
});

server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});

// Ensure default rooms exist
const ensureDefaultRoomsExist = async () => {
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
};

ensureDefaultRoomsExist();

// Registration endpoint
app.post('/register', authController.register);

// Login endpoint
app.post('/login', authController.login);

module.exports = app;
