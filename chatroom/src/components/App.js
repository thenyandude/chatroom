import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import '../App.css'
import Register from './Register';
import Login from './Login';
import UserSettings from './UserSettings';
import NavigationButton from './NavigationButton'; // Adjust the path as per your directory structure


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
    console.log(`Deleting message: ID=${messageId}, Username=${username}, isAdmin=${isAdmin}`);
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
          username ? (
            <>
              <p>Welcome, {username}! <button onClick={handleLogout}>Logout</button></p>
              <select onChange={(e) => handleRoomChange(e.target.value)} value={currentRoom}>
                {rooms.map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            <div>
            <div>
            {
  messages.map((msg, index) => (
    <div key={index}>
      <strong>{msg.user}: </strong>
      {editingMessage && editingMessage._id === msg._id ? (
        <>
          <input
            type="text"
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
          />
          <button onClick={() => submitEdit(msg._id, editingText)}>Submit</button>
        </>
      ) : (
        <>
          <span>{msg.text}</span>
          {msg.isEdited && <span className="edited-indicator">(edited)</span>}
          <br></br>
          <small style={{ fontSize: '0.8em' }}>
            {new Date(msg.timestamp).toLocaleString()}
          </small>
          {msg.user !== "System" && ((msg.user === username && !isAdmin) || isAdmin) && (
            <>
              {msg.user === username && <button onClick={() => startEditing(msg)}>Edit</button>}
              <button onClick={() => deleteMessage(msg._id)}>Delete</button>
            </>
          )}
        </>
      )}
    </div>
  ))
}

    </div>
            </div>
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
              <button onClick={sendMessage}>Send</button>
              <NavigationButton pathToNavigateTo="/settings" buttonText="To Settings" />       
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
