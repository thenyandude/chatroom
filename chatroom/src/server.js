// src/server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes.js');


const Message = require('./models/messageModel');

const authController = require('./controllers/authController');

const app = express();
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

app.use('/user', userRoutes);


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


//Admin code

app.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.body.username; // Username of the person deleting the message

    if (message.user === "System") {
      return res.status(403).send('Cannot delete system messages');
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).send('Message not found');
    }

    // Check if the user is the author of the message or an admin
    if (message.user === username || req.body.isAdmin) {
      const updatedMessage = await Message.findByIdAndUpdate(id, {
        user: "System",
        text: `Message deleted by ${username}`,
        isDeleted: true
      }, { new: true });

      // Broadcast the updated message
      clientRooms.forEach((room, client) => {
        if (client.readyState === WebSocket.OPEN && room === message.room) {
          client.send(JSON.stringify({ type: 'updateMessage', message: updatedMessage }));
        }
      });

      res.status(200).send('Message updated');
    } else {
      res.status(403).send('Unauthorized to delete this message');
    }
  } catch (error) {
    res.status(500).send('Error updating message');
  }
});

// WebSocket server
// Corrected WebSocket server code
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
      const newMessage = new Message({
        user: data.user,
        room: clientRooms.get(ws),
        text: data.text
      });
      
      await newMessage.save();

      wss.clients.forEach(client => {
        if (clientRooms.get(client) === clientRooms.get(ws) && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'newMessage', message: newMessage }));
        }
      });
    }
  });

  ws.on('close', () => {
    clientRooms.delete(ws); // Remove the client from the tracking map
    console.log('Client disconnected');
  });
});


module.exports = app;