import React from 'react';
import { useUserSettings } from '../context/UserContext'; // Ensure this path is correct

function UserProfileModal({ isAdmin, onClose }) {
    const { userSettings } = useUserSettings();

    return (
        <div className="modal-background">
            <div className="modal">
                <h2>Profile of {userSettings.username}</h2>
                <p>Pronouns: {userSettings.pronouns}</p>
                <p>Description: {userSettings.description}</p>
                {isAdmin && (
                    <div>
                        <button onClick={() => console.log("Ban logic placeholder")}>Ban User</button>
                        <button onClick={() => console.log("Mute logic placeholder")}>Mute User</button>
                    </div>
                )}
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default UserProfileModal;
