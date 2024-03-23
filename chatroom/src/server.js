const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());
app.use(require('cors')()); // Enable CORS

// Connecting to the 'chatroom' database
mongoose.connect('mongodb://127.0.0.1:27017/chatroom', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define a schema for your messages in the 'general' collection
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

// Create a model from the schema for the 'general' collection
const GeneralChat = mongoose.model('GeneralChat', messageSchema, 'general');

const server = http.createServer(app);

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

// Start the HTTP server
server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});