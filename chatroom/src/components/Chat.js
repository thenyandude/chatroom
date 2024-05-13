import React, { useState } from 'react';
import NavigationButton from './NavigationButton';
import UserProfileModal from './UserProfileModal';
import '../css/Chat.css';

function Chat({ 
    username, 
    message,
    rooms, 
    currentRoom, 
    handleRoomChange, 
    messages, 
    setMessage, 
    sendMessage, 
    deleteMessage, 
    startEditing, 
    submitEdit, 
    handleLogout, 
    isAdmin, 
    editingMessage, 
    setEditingText, 
    editingText 
}) {

    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleProfileClick = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    return (
        <>
            <p>
                Welcome, {username}! 
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
                            onClick={() => handleProfileClick(msg.user)}
                            style={{ borderColor: msg.usernameColor }} // Color applied to the border
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
                                {msg.user !== "System" && ((msg.user === username && !isAdmin) || isAdmin) && (
                                    <>
                                        {msg.user === username && <button onClick={() => startEditing(msg)} className="button-tertiary">Edit</button>}
                                        <button onClick={() => deleteMessage(msg._id)} className="button-danger">Delete</button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ))}

                {isModalOpen && (
                    <UserProfileModal 
                        user={selectedUser} 
                        isAdmin={isAdmin} 
                        onClose={() => setIsModalOpen(false)} 
                    />
                )}
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
        </>
    );
}

export default Chat;
