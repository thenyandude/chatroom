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
        room: roomName,
        user: 'System',
        text: `Welcome to the ${roomName} room!`,
        timestamp: new Date()
      });
      await initialMessage.save();
    }
  });
});

// Create a room
app.post('/rooms', async (req, res) => {
  const { roomName } = req.body;
  // You might want to create an initial message or room document here
  res.status(201).json({ message: `Room ${roomName} created` });
});

// WebSocket server
// Corrected WebSocket server code
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let currentRoom = 'general'; // Default room

  ws.on('message', (messageData) => {
    const data = JSON.parse(messageData);
    if (data.type === 'joinRoom') {
      currentRoom = data.room;
      GeneralChat.find({ room: currentRoom }).sort({ timestamp: 1 })
        .then(messages => {
          ws.send(JSON.stringify({ type: 'roomMessages', messages }));
        })
        .catch(err => {
          console.error('Failed to retrieve message history:', err);
        });
    } else if (data.type === 'message') {
      const newMessage = new GeneralChat({ user: data.user, room: currentRoom, text: data.text });
      newMessage.save().then(savedMessage => {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && currentRoom === data.room) {
            client.send(JSON.stringify({ type: 'newMessage', message: savedMessage }));
          }
        });
      }).catch(err => console.error(err));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});