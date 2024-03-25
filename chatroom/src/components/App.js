import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [rooms, setRooms] = useState(['general']);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // WebSocket connection setup
  useEffect(() => {
    const newSocket = new WebSocket('ws://localhost:5000');
    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'roomMessages') {
        setMessages(data.messages);
      } else if (data.type === 'newMessage') {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      }
    };

    newSocket.onopen = () => {
      newSocket.send(JSON.stringify({ type: 'joinRoom', room: 'general' }));
    };

    return () => newSocket.close();
  }, []);

  // Fetch the list of rooms
  useEffect(() => {
    fetch('http://localhost:5000/rooms')
      .then((response) => response.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error('Error fetching rooms:', err));
  }, []);

  const handleLogout = () => {
    setUsername('');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    setCurrentRoom('general');
  };

  const handleRoomChange = (newRoom) => {
    setCurrentRoom(newRoom);
    setMessages([]);
    socket.send(JSON.stringify({ type: 'joinRoom', room: newRoom }));
  };

  const sendMessage = () => {
    socket.send(JSON.stringify({ type: 'message', room: currentRoom, user: username, text: message }));
    setMessage('');
  };

  // Admin code
  useEffect(() => {
    setIsAdmin(localStorage.getItem('isAdmin') === 'true');
  }, []);

  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:5000/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status} ${response.statusText}`);
      }
      setMessages(messages.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message:', error.message);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate replace to="/register" />} />
        <Route path="/register" element={username ? <Navigate replace to="/chat" /> : <Register />} />
        <Route path="/login" element={username ? <Navigate replace to="/chat" /> : <Login onLogin={setUsername} />} />
        <Route path="/chat" element={
          username ? (
            <>
              <p>Welcome, {username}! <button onClick={handleLogout}>Logout</button></p>
              <select onChange={(e) => handleRoomChange(e.target.value)} value={currentRoom}>
                {rooms.map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
              <div>
                {messages.map((msg, index) => (
                  <div key={index}>
                    <strong>{msg.user}: </strong>{msg.text}
                    {isAdmin && <button onClick={() => deleteMessage(msg._id)}>Delete</button>}
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
