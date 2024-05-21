import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import UserSettings from './UserSettings';
import Chat from './Chat';

function App() {
  const navigate = useNavigate();

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
    const fetchRooms = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/chat/rooms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setRooms(data);
    };

    fetchRooms();
  }, []);

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
      newSocket.send(JSON.stringify({ type: 'joinRoom', room: currentRoom }));
    };

    return () => newSocket.close();
  }, [currentRoom]);

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
    navigate('/login');
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

  const handleRoomChange = (newRoom) => {
    setCurrentRoom(newRoom);
    if (socket) {
      socket.send(JSON.stringify({ type: 'joinRoom', room: newRoom }));
    }
  };

  const deleteMessage = async (messageId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
    } else {
      console.error('Failed to delete message');
    }
  };
  
  

  const startEditing = (message) => {
    setEditingMessage(message);
    setEditingText(message.text);
  };

  const submitEdit = async (messageId, newText) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/chat/messages/edit/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text: newText, username: user.username, isAdmin: user.isAdmin }),
    });
    if (response.ok) {
      const updatedMessage = await response.json();
      setMessages(prevMessages => prevMessages.map(msg => msg._id === messageId ? updatedMessage : msg));
      setEditingMessage(null);
      setEditingText('');
    } else {
      console.error('Failed to edit message');
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/register" element={user.username ? <Navigate replace to="/chat" /> : <Register />} />
      <Route path="/login" element={user.username ? <Navigate replace to="/chat" /> : <Login onLogin={setUser} />} />
      <Route path="/settings" element={<UserSettings user={user} updateUser={setUser} />} />
      <Route path="/chat" element={<Chat user={user} rooms={rooms} currentRoom={currentRoom} messages={messages} setMessage={setMessage} sendMessage={sendMessage} handleLogout={handleLogout} handleRoomChange={handleRoomChange} deleteMessage={deleteMessage} startEditing={startEditing} submitEdit={submitEdit} editingMessage={editingMessage} setEditingMessage={setEditingMessage} editingText={editingText} setEditingText={setEditingText} />} />
    </Routes>
  );
}

export default App;
