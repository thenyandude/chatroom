import React, { useState } from 'react';
import NavigationButton from './NavigationButton';
import UserInfoModal from './UserProfileModal';
import '../css/Chat.css';

function Chat({
  user,
  rooms,
  currentRoom,
  handleRoomChange,
  message,
  messages,
  setMessage,
  sendMessage,
  handleLogout,
  deleteMessage,
  startEditing,
  submitEdit,
  editingMessage,
  setEditingText,
  editingText
}) {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleProfileClick = async (username) => {
    try {
      const response = await fetch(`http://localhost:5000/user/${username}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      const data = await response.json();
      setSelectedUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleBanUser = async (username) => {
    try {
      const response = await fetch(`http://localhost:5000/user/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        console.log('User banned successfully');
        setSelectedUser(null); // Close the modal after banning
      } else {
        console.error('Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  return (
    <>
      <p>
        <button onClick={handleLogout} className="button-secondary">Logout</button>
        <NavigationButton pathToNavigateTo={"/settings"} buttonText={"Settings"} className="nav-chat"/>
      </p>
      <div className="dropdown-room">
        <select onChange={(e) => handleRoomChange(e.target.value)} value={currentRoom} className="dropdown-select">
          {rooms.map((room) => (
            <option key={room} value={room}>{room}</option>
          ))}
        </select>
      </div>
      <div className='message-container'>
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <img 
              src={`http://localhost:5000/uploads/${msg.userProfilePicture}`} 
              alt="Profile" 
              className="profile-picture"
              style={{ borderColor: msg.usernameColor }} // Color applied to the border
              onClick={() => handleProfileClick(msg.user)} // Handle profile click
            />
            <strong style={{color: msg.usernameColor}}>{msg.user}: </strong>
            {editingMessage && editingMessage._id === msg._id ? (
              <>
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="input-edit"
                />
                <button onClick={() => submitEdit(msg._id, editingText)} className="button-primary">Submit</button>
              </>
            ) : (
              <>
                <span>{msg.text}</span>
                {msg.isEdited && <span className="edited-indicator">(edited)</span>}
                <br />
                <small>{new Date(msg.timestamp).toLocaleString()}</small>
                {msg.user !== "System" && ((msg.user === user.username && !user.isAdmin) || user.isAdmin) && (
                  <>
                    {msg.user === user.username && <button onClick={() => startEditing(msg)} className="button-tertiary">Edit</button>}
                    <button onClick={() => deleteMessage(msg._id)} className="button-danger">Delete</button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="message-input">
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message" 
          className="input-message"
        />
        <button onClick={sendMessage} className="button-primary">Send</button>
      </div>

      {selectedUser && (
        <UserInfoModal 
          user={selectedUser} 
          onClose={closeModal} 
          onBan={handleBanUser} 
          isAdmin={user.isAdmin} 
        />
      )}
    </>
  );
}

export default Chat;
