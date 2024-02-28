const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());
app.use(require('cors')()); // Enable CORS

// Function to ensure the required directory and file structure
function ensureDirectoryStructure() {
  const privatePath = path.join(__dirname, 'private');
  const usersPath = path.join(privatePath, 'users');
  const chatsPath = path.join(privatePath, 'chats');

  // Ensure the private directory exists
  if (!fs.existsSync(privatePath)) {
    fs.mkdirSync(privatePath, { recursive: true });
  }

  // Ensure the users directory exists
  if (!fs.existsSync(usersPath)) {
    fs.mkdirSync(usersPath, { recursive: true });
  }

  // Ensure the chats directory exists
  if (!fs.existsSync(chatsPath)) {
    fs.mkdirSync(chatsPath, { recursive: true });
  }

  // Create a 'general.json' in chats directory if it doesn't exist
  const generalChatPath = path.join(chatsPath, 'general.json');
  if (!fs.existsSync(generalChatPath)) {
    fs.writeFileSync(generalChatPath, JSON.stringify([]));
  }
}

// Call the function to ensure the structure on server start
ensureDirectoryStructure();

// Endpoint to send messages
const chatsPath = path.join(__dirname, 'private', 'chats');
const generalChatPath = path.join(chatsPath, 'general.json');

// Function to read messages from the general chat file
function readMessages() {
  if (fs.existsSync(generalChatPath)) {
    return JSON.parse(fs.readFileSync(generalChatPath, 'utf8'));
  }
  return [];
}

// Function to write messages to the general chat file
function writeMessages(messages) {
  fs.writeFileSync(generalChatPath, JSON.stringify(messages, null, 2));
}

// Endpoint to send messages
app.post('/send-message', (req, res) => {
  const { message, username } = req.body;
  const newMessage = { 
    username, 
    content: message, 
    timestamp: new Date().toISOString()
  };

  const messages = readMessages();
  messages.push(newMessage);
  writeMessages(messages);

  res.json(newMessage);
});

app.get('/get-messages', (req, res) => {
  const messages = readMessages();
  res.json(messages);
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const userFilePath = path.join(__dirname, 'private', 'users', `${username}.json`);

    // Check if user file already exists
    if (fs.existsSync(userFilePath)) {
      return res.status(400).send('User already exists');
    }

    const user = { username, password: hashedPassword };
    
    // Write the user data to a file named {username}.json
    fs.writeFileSync(userFilePath, JSON.stringify(user));

    res.status(201).send('User registered');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userFilePath = path.join(__dirname, 'private', 'users', `${username}.json`);

    // Check if user file exists
    if (!fs.existsSync(userFilePath)) {
      return res.status(401).send('Invalid credentials');
    }

    const user = JSON.parse(fs.readFileSync(userFilePath));

    // Compare the provided password with the stored hashed password
    if (await bcrypt.compare(password, user.password)) {
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
