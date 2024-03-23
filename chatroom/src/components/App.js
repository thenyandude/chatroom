import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [rooms, setRooms] = useState(['general']); // Default room list
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);

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

    // Join the default room on connection
    newSocket.onopen = () => {
      newSocket.send(JSON.stringify({ type: 'joinRoom', room: 'general' }));
    };

    return () => newSocket.close();
  }, []);

  // Fetch the list of rooms
  useEffect(() => {
    fetch('/rooms')
      .then(response => response.json())
      .then(  setRooms(['general', 'code', 'music', 'gaming']))
      .catch(err => console.error('Error fetching rooms:', err));
  }, []);

  const handleLogout = () => {
    setUsername('');
    localStorage.removeItem('username');
    setCurrentRoom('general'); // Reset room on logout
  };

  const handleRoomChange = (newRoom) => {
    setCurrentRoom(newRoom);
    setMessages([]); // Clear messages when switching rooms
    socket.send(JSON.stringify({ type: 'joinRoom', room: newRoom }));
  };

  const sendMessage = () => {
    socket.send(JSON.stringify({ type: 'message', room: currentRoom, user: username, text: message }));
    setMessage('');
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
  {rooms.map(room => (
    <option key={room} value={room}>{room}</option>
  ))}
</select>

              <div>
                {messages.map((msg, index) => (
                  <div key={index}>
                    <strong>{msg.user}: </strong>{msg.text}
                    <br />
                    <small>{new Date(msg.timestamp).toLocaleString()}</small>
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
