// src/server.js
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes.js');
require('dotenv').config();

console.log('JWT Secret:', process.env.JWT_SECRET);




const Message = require('./models/messageModel');
const User = require('./models/userModel');

const authController = require('./controllers/authController');

const app = express();
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors({ origin: 'http://10.12.5.35:80', credentials: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect('mongodb://10.12.5.42:27017/chatroom', {
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});


// Use the auth and chat routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/user', userRoutes);


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
  // You might want to create an initial message or room document here
  res.status(201).json({ message: `Room ${roomName} created` });
});


//Admin code

app.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.body.username; // Username of the person deleting the message
    const isAdmin = req.body.isAdmin; // Admin status of the user

    // First, find the message in the database
    const message = await Message.findById(id);
    if (!message) {
      console.log('Message not found:', id);
      return res.status(404).send('Message not found');
    }

    // Check if the message is a system message
    if (message.user === "System") {
      console.log('Cannot delete system messages');
      return res.status(403).send('Cannot delete system messages');
    }

    // Check if the user is the author of the message or an admin
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

      // Broadcast the updated message
      clientRooms.forEach((room, client) => {
        if (client.readyState === WebSocket.OPEN && room === message.room) {
          client.send(JSON.stringify({ type: 'updateMessage', message: updatedMessage }));
        }
      });

      console.log('Message successfully deleted or updated:', updatedMessage);
      res.status(200).send('Message updated');
    } else {
      console.log('Unauthorized deletion attempt by:', username);
      res.status(403).send('Unauthorized to delete this message');
    }
  } catch (error) {
    console.error('Error in message deletion:', error);
    res.status(500).send('Error updating message');
  }
});


app.put('/messages/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, username } = req.body;
    // Ensure only the message owner or an admin can edit
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).send('Message not found');
    }

    // Check if the user is the author of the message
    if (message.user === username || req.body.isAdmin) {
      const updatedMessage = await Message.findByIdAndUpdate(id, { 
        text: text, 
        editedBy: username, 
        isEdited: true 
      }, { new: true });

      // Broadcast the updated message
      clientRooms.forEach((room, client) => {
        if (client.readyState === WebSocket.OPEN && room === message.room) {
          client.send(JSON.stringify({ type: 'updateMessage', message: updatedMessage }));
        }
      });

      res.status(200).json(updatedMessage);
    } else {
      res.status(403).send('Unauthorized to edit this message');
    }
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).send('Error editing message');
  }
});

//settings


app.get('/available-profile-pictures', (req, res) => {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Could not list the directory.', err);
      return res.status(500).json({ error: err.message });
    }

    // Filter files to include only .png images and exclude 'system.png'
    const imageFiles = files.filter(file => file.endsWith('.png') && file !== 'system.png');
    res.json(imageFiles);
  });
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



module.exports = app;