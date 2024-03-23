// src/server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bcrypt = require('bcrypt');

const User = require('./models/userModel');
const GeneralChat = require('./models/messageModel');


const app = express();
app.use(bodyParser.json());
app.use(require('cors')());

mongoose.connect('mongodb://127.0.0.1:27017/chatroom', {
  useNewUrlParser: true,
  useUnifiedTopology: true
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
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if the user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).send('User already exists');
    }

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    // Save the new user
    await newUser.save();
    res.status(201).send('User registered');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send('Invalid credentials');
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }

    // If login is successful, you might want to start a session or issue a token
    res.status(200).send('Login successful');
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});



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