// src/components/UserProfileModal.js
import React from 'react';
import '../css/UserProfileModal.css';

const UserProfileModal = ({ user, onClose, onBan, isAdmin }) => {
  const handleBanClick = () => {
    console.log("Ban button clicked for user:", user.username); // Debug line
    onBan(user.username); // Pass the username to the onBan function
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img 
          src={`http://localhost:5000/uploads/${user.profilePicture}`} 
          alt="Profile" 
          className="profile-picture-large"
        />
        <h2>{user.username}</h2>
        <p><strong>Description:</strong> {user.description}</p>
        <p><strong>Pronouns:</strong> {user.pronouns}</p>
        {isAdmin && (
          <button onClick={handleBanClick} className="button-danger">Ban User</button>
        )}
        <button onClick={onClose} className="button-secondary">Close</button>
      </div>
    </div>
  );
};

export default UserProfileModal;
