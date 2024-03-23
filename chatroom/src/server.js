// src/server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

const User = require('./models/userModel');
const GeneralChat = require('./models/messageModel');

const authController = require('./controllers/authController');

const app = express();
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());


mongoose.connect('mongodb://127.0.0.1:27017/chatroom', {
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});


// Use the auth and chat routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

// ...WebSocket setup and other middleware...

const server = http.createServer(app);
server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});


// Registration endpoint
// Registration endpoint
app.post('/register', authController.register);

// Login endpoint
app.post('/login', authController.login);



// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Fetch and send all messages from MongoDB when a client connects.
  GeneralChat.find().sort({ timestamp: 1 }).then(messages => {
    ws.send(JSON.stringify(messages));
  }).catch(err => {
    console.error('Failed to retrieve message history:', err);
  });

  ws.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      const newMessage = new GeneralChat(parsedMessage);

      // Save the new message to MongoDB
      const savedMessage = await newMessage.save();

      // Broadcast the saved message to all connected clients
      const messageToSend = JSON.stringify(savedMessage);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageToSend);
        }
      });
    } catch (err) {
      console.error('Error handling the new message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});