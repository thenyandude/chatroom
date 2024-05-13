import React, { useState, useEffect } from 'react';
import NavigationButton from './NavigationButton';
import { useUserSettings } from '../context/UserContext'; // Import the context hook
import '../css/UserSettings.css'; // Import your CSS

function UserSettings() {
    const [profilePicture, setProfilePicture] = useState('');
    const [previewImage, setPreviewImage] = useState('');
    const [usernameColor, setUsernameColor] = useState('#000000');
    const [pronouns, setPronouns] = useState('');
    const [description, setDescription] = useState('');
    const [availablePfps, setAvailablePfps] = useState([]);
    const { updateUserSettings } = useUserSettings();

    useEffect(() => {
        const fetchAvailablePfps = async () => {
            try {
                const response = await fetch('http://localhost:5000/available-profile-pictures');
                const data = await response.json();
                if (!response.ok) throw new Error('Failed to fetch available profile pictures');
                setAvailablePfps(data);
                if (data.length > 0 && !profilePicture) {
                    selectProfilePicture(data[0]);
                }
            } catch (error) {
                console.error('Error fetching profile pictures:', error);
            }
        };
        fetchAvailablePfps();
    }, []);

    const selectProfilePicture = (filename) => {
        setProfilePicture(filename);
        setPreviewImage(`http://localhost:5000/uploads/${filename}`);
    };

    const handleColorChange = (e) => setUsernameColor(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = { profilePicture, usernameColor, pronouns, description };
        try {
            const response = await fetch('http://localhost:5000/user/updateSettings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error('Failed to update settings');
            const data = await response.json();
            updateUserSettings(data); // Update context with new settings
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="settings-form">
            {previewImage && <img src={previewImage} alt="Profile Preview" className="profile-picture-preview" />}
            <div className="profile-pictures-container">
                {availablePfps.map(pfp => (
                    <img
                        key={pfp}
                        src={`http://localhost:5000/uploads/${pfp}`}
                        alt="Profile Picture"
                        onClick={() => selectProfilePicture(pfp)}
                        className={`profile-picture-option ${profilePicture === pfp ? 'active' : ''}`}
                    />
                ))}
            </div>
            <input type="color" value={usernameColor} onChange={handleColorChange} className="settings-color-picker" />
            <input type="text" value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="Pronouns" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            <button type="submit" className="settings-submit-button">Update Settings</button>
            <NavigationButton pathToNavigateTo="/chat" buttonText="Back to Chat" className="nav-settings" />
        </form>
    );
}

export default UserSettings;
