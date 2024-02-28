// Assuming this is chat-server/index.js inside the src directory
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(require('cors')()); // Enable CORS

// Function to ensure the required directory and file structure
function ensureDirectoryStructure() {
  const privatePath = path.join(__dirname, 'private');
  const usersFilePath = path.join(privatePath, 'users.json');

  if (!fs.existsSync(privatePath)) {
    fs.mkdirSync(privatePath, { recursive: true });
  }

  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
  }
}

ensureDirectoryStructure();

let messages = [];

app.post('/send-message', (req, res) => {
  const { message, username } = req.body; // Assuming username is sent in the request
  const newMessage = { 
    username, 
    content: message, 
    timestamp: new Date().toISOString() // ISO format for timestamp
  };
  messages.push(newMessage);
  res.json(newMessage);
});


app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = { username, password: hashedPassword };
    const usersPath = path.join(__dirname, '/private/users.json');

    // Check if users file exists
    if (!fs.existsSync(usersPath)) {
      fs.writeFileSync(usersPath, JSON.stringify([]));
    }

    const users = JSON.parse(fs.readFileSync(usersPath));
    if (users.find(u => u.username === username)) {
      return res.status(400).send('User already exists');
    }

    users.push(user);
    fs.writeFileSync(usersPath, JSON.stringify(users));
    res.status(201).send('User registered');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const usersPath = path.join(__dirname, 'private', 'users.json');
  
      const users = JSON.parse(fs.readFileSync(usersPath));
      const user = users.find(u => u.username === username);
  
      if (user && await bcrypt.compare(password, user.password)) {
        res.status(200).send('Login successful');
      } else {
        res.status(401).send('Invalid credentials');
      }
    } catch (error) {
      res.status(500).send('Error logging in');
    }
  });
  

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
