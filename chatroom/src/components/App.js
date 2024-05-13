import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import UserSettings from './UserSettings';
import Chat from './Chat';

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [rooms, setRooms] = useState(['general']);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [userProfilePicture, setUserProfilePicture] = useState(localStorage.getItem('userProfilePicture') || '');
 const [usernameColor, setUsernameColor] = useState(localStorage.getItem('usernameColor') || '#000000'); // Default to black



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
      } else if (data.type === 'updateMessage') {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === data.message._id ? data.message : msg
          )
        );
      }
    };

    newSocket.onopen = () => {
      newSocket.send(JSON.stringify({ type: 'joinRoom', room: 'general' }));
    };

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (username) {
      fetch(`http://localhost:5000/user/${username}/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      })
      .then((response) => response.json())
      .then((data) => {
        setUserProfilePicture(data.profilePicture);
        setUsernameColor(data.usernameColor);
        localStorage.setItem('userProfilePicture', data.profilePicture);
        localStorage.setItem('usernameColor', data.usernameColor);
      })
      .catch((error) => console.error('Error fetching user settings:', error));
    }
  }, [username]);

  // Fetch the list of rooms
  useEffect(() => {
    fetch('http://localhost:5000/rooms')
      .then((response) => response.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error('Error fetching rooms:', err));
  }, []);

  const handleLogout = () => {
    setUsername('');
    setUserProfilePicture('');
    setUsernameColor('#000000'); // Reset to default color
    localStorage.removeItem('username');
    localStorage.removeItem('userProfilePicture');
    localStorage.removeItem('usernameColor');
    localStorage.removeItem('isAdmin');
    setCurrentRoom('general');
  };
  

  const handleRoomChange = (newRoom) => {
    setCurrentRoom(newRoom);
    setMessages([]);
    socket.send(JSON.stringify({ type: 'joinRoom', room: newRoom }));
  };

  const sendMessage = () => {
    if (socket) {
      const messageToSend = {
        type: 'message',
        room: currentRoom,
        user: username,
        userProfilePicture, // This is now available from the state
        usernameColor, // This is now available from the state
        text: message,
      };
      socket.send(JSON.stringify(messageToSend));
      setMessage('');
    }
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
        body: JSON.stringify({ username, isAdmin }) // Send username and isAdmin status
      });
      if (!response.ok) {
        console.error('Failed to delete message:', response);
        throw new Error(`Failed to delete message: ${response.status} ${response.statusText}`);
      }
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    }
  };
  

  const startEditing = (message) => {
    if (message.user === username) {
      setEditingMessage(message);
      setEditingText(message.text);
    }
  };

  const submitEdit = async (id, newText) => {
    try {
      const response = await fetch(`http://localhost:5000/messages/edit/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Include authorization headers if needed
        },
        body: JSON.stringify({ text: newText, username }),
      });
      if (!response.ok) {
        throw new Error('Failed to edit message');
      }
      const updatedMessage = await response.json();
  setMessages(messages.map(msg => msg._id === id ? {...updatedMessage, isEdited: true} : msg));
  setEditingMessage(null);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };



  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate replace to="/register" />} />
        <Route path="/register" element={username ? <Navigate replace to="/chat" /> : <Register />} />
        <Route path="/login" element={username ? <Navigate replace to="/chat" /> : <Login onLogin={setUsername} />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/chat" element={
    username ? <Chat 
        username={username} 
        rooms={rooms} // Ensure this prop is being passed
        currentRoom={currentRoom}
        handleRoomChange={handleRoomChange}
        messages={messages}
        setMessage={setMessage}
        sendMessage={sendMessage}
        deleteMessage={deleteMessage}
        startEditing={startEditing}
        submitEdit={submitEdit}
        handleLogout={handleLogout}
        isAdmin={isAdmin}
        editingMessage={editingMessage}
        setEditingText={setEditingText}
        userProfilePicture={userProfilePicture}
        usernameColor={usernameColor}
    /> : <Navigate replace to="/login" />
} />

      </Routes>
    </Router>
  );
}


export default App;