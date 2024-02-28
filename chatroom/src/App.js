// src/App.js
import React, { useState, useEffect } from 'react';import Register from './Register';
import Login from './Login';

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState(''); // State for storing the logged-in username

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogin = (loggedInUsername) => {
    setUsername(loggedInUsername);
    localStorage.setItem('username', loggedInUsername); // Save username to local storage
  };

  const handleLogout = () => {
    setUsername(''); // Clear username from state
    localStorage.removeItem('username'); // Clear username from local storage
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
      {username ? (
        <>
          <p>Welcome, {username}! <button onClick={handleLogout}>Logout</button></p>
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
        </>
      ) : (
        <>
          <Register />
          <Login onLogin={handleLogin} />
        </>
      )}
    </div>
  );
}

export default App;
