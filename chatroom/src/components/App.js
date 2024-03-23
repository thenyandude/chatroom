import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogin = (loggedInUsername) => {
    setUsername(loggedInUsername);
    localStorage.setItem('username', loggedInUsername);
  };

  const handleLogout = () => {
    setUsername('');
    localStorage.removeItem('username');
    if (socket) {
      socket.close();
    }
  };

  const sendMessage = () => {
    if (socket && message) {
      const messageObject = { user: username, text: message };
      socket.send(JSON.stringify(messageObject));
      setMessage('');
    }
  };

  useEffect(() => {
    if (!username) return;
    
    const newSocket = new WebSocket('ws://localhost:5000');

    newSocket.onopen = () => {
      console.log('WebSocket Connected');
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // If an array is received, it's the initial message history
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        // If it's an object, it's a new message
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    };

    newSocket.onclose = (event) => {
      console.log('WebSocket Disconnected:', event);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [username]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate replace to="/register" />} />
        <Route path="/register" element={username ? <Navigate replace to="/chat" /> : <Register />} />
        <Route path="/login" element={username ? <Navigate replace to="/chat" /> : <Login onLogin={handleLogin} />} />
        <Route path="/chat" element={
          username ? (
            <>
              <p>Welcome, {username}! <button onClick={handleLogout}>Logout</button></p>
              <div>
                {messages.map((msg, index) => (
                  <div key={index}>
                    <strong>{msg.user}: </strong>{msg.text}
                    <br />
                    <small style={{ fontSize: '0.8em' }}>
                      {new Date(msg.timestamp).toLocaleString()}
                    </small>
                  </div>
                ))}
              </div>
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
              <button onClick={sendMessage}>Send</button>
            </>
          ) : (
            <Navigate replace to="/login" />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
