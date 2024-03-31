import React from 'react';

function Chat({ 
    username, 
    userProfilePicture,
    usernameColor,
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
    return (
        <>
            <p>Welcome, {username}! <button onClick={handleLogout}>Logout</button></p>
            <select onChange={(e) => handleRoomChange(e.target.value)} value={currentRoom}>
                {rooms.map((room) => (
                    <option key={room} value={room}>{room}</option>
                ))}
            </select>

            <div className="message-container">
                {messages.map((msg, index) => (
                    <div key={index} className="message">
                        {msg.userProfilePicture && (
                            <img src={msg.userProfilePicture} alt={msg.user} className="profile-picture" />
                        )}
                        <strong style={{ color: msg.usernameColor }}>{msg.user}:</strong>

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
                                <br />
                                <small>{new Date(msg.timestamp).toLocaleString()}</small>
                                {msg.user !== "System" && ((msg.user === username && !isAdmin) || isAdmin) && (
                                    <>
                                        {msg.user === username && <button onClick={() => startEditing(msg)}>Edit</button>}
                                        <button onClick={() => deleteMessage(msg._id)}>Delete</button>
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
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </>
    );
}

export default Chat;
