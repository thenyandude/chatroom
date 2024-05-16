import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import UserSettings from './UserSettings';
import Chat from './Chat';

function App() {
  const [user, setUser] = useState({
    username: localStorage.getItem('username') || '',
    profilePicture: localStorage.getItem('userProfilePicture') || '',
    usernameColor: localStorage.getItem('usernameColor') || '#000000',
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    description: '',
    pronouns: '',
  });


  const [rooms, setRooms] = useState(['general']);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    const newSocket = new WebSocket('ws://localhost:5000');
    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'roomMessages') {
        setMessages(data.messages);
      } else if (data.type === 'newMessage') {
        setMessages(prevMessages => [...prevMessages, data.message]);
      } else if (data.type === 'updateMessage') {
        setMessages(prevMessages =>
          prevMessages.map(msg => msg._id === data.message._id ? data.message : msg)
        );
      }
    };

    newSocket.onopen = () => {
      newSocket.send(JSON.stringify({ type: 'joinRoom', room: 'general' }));
    };

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (user.username) {
      fetch(`http://localhost:5000/user/${user.username}/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      })
      .then(response => response.json())
      .then(data => {
        setUser(prevUser => ({
          ...prevUser,
          profilePicture: data.profilePicture,
          usernameColor: data.usernameColor,
          description: data.description,  // Update description
          pronouns: data.pronouns         // Update pronouns
        }));
        localStorage.setItem('userProfilePicture', data.profilePicture);
        localStorage.setItem('usernameColor', data.usernameColor);
      })
      .catch(error => console.error('Error fetching user settings:', error));
    }
  }, [user.username]);

  const handleLogout = () => {
    localStorage.clear(); // Clear all local storage
    setUser({  // Reset user state
      username: '',
      profilePicture: '',
      usernameColor: '#000000',
      isAdmin: false,
      description: '',
      pronouns: '',
    });
  };




  const sendMessage = () => {
    if (socket) {
      const messageToSend = {
        type: 'message',
        room: currentRoom,
        user: user.username,
        userProfilePicture: user.profilePicture,
        usernameColor: user.usernameColor,
        text: message,
      };
      socket.send(JSON.stringify(messageToSend));
      setMessage('');
    }
  };

  // Route definitions
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/register" element={user.username ? <Navigate replace to="/chat" /> : <Register />} />
        <Route path="/login" element={user.username ? <Navigate replace to="/chat" /> : <Login onLogin={setUser} />} />
        <Route path="/settings" element={<UserSettings user={user} updateUser={setUser} />} />
        <Route path="/chat" element={<Chat user={user} rooms={rooms} currentRoom={currentRoom} messages={messages} setMessage={setMessage} sendMessage={sendMessage} />} />
      </Routes>
    </Router>
  );
}

export default App;
