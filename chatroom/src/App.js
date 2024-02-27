// src/App.js
import React, { useState } from 'react';
import Register from './Register';
import Login from './Login';

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    if (message) {
      try {
        const response = await fetch('http://localhost:5000/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
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

      <Login />
      
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg.content}</div>
        ))}
      </div>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
