// src/App.js
import React, { useState } from 'react';
import Register from './Register';
import Login from './Login';

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState(''); // State for storing the logged-in username

  const handleLogin = (loggedInUsername) => {
    setUsername(loggedInUsername); // Update the username when the user logs in
  };

  const sendMessage = async () => {
    if (message && username) {
      try {
        const response = await fetch('http://localhost:5000/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, username }), // Include the username in the message
        });
        const newMessage = await response.json();
        setMessages([...messages, newMessage]);
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  return (
    <div>
      <Register />
      <Login onLogin={handleLogin} />
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.username}: </strong>{msg.content}
            <br />
            <small style={{ fontSize: '0.8em' }}>{new Date(msg.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
