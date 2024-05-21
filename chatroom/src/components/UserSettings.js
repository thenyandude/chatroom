import React, { useState, useEffect } from 'react';
import NavigationButton from './NavigationButton';
import '../css/UserSettings.css';

function UserSettings({ user, updateUser }) {
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const [previewImage, setPreviewImage] = useState('');
  const [usernameColor, setUsernameColor] = useState(user.usernameColor);
  const [availablePfps, setAvailablePfps] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const [description, setDescription] = useState(user.description || '');
  const [pronouns, setPronouns] = useState(user.pronouns || '');

  useEffect(() => {
    const fetchedToken = localStorage.getItem('token');
    setToken(fetchedToken);
  
    if (!fetchedToken) {
      console.error('No token found in storage');
      return;
    }
  
    const fetchData = async () => {
      try {
        const responsePfps = await fetch('http://localhost:5000/available-profile-pictures');
        const dataPfps = await responsePfps.json();
        console.log('Fetched Profile Pictures:', dataPfps); // Debugging statement
        setAvailablePfps(dataPfps);
  
        const responseUserSettings = await fetch(`http://localhost:5000/user/${localStorage.getItem('username')}/settings`, {
          headers: {
            'Authorization': `Bearer ${fetchedToken}`,
            'Content-Type': 'application/json'
          }
        });
        const dataUserSettings = await responseUserSettings.json();
        console.log('Fetched User Settings:', dataUserSettings); // Debugging statement
        setUsernameColor(dataUserSettings.usernameColor);
        setProfilePicture(dataUserSettings.profilePicture);
        setPreviewImage(`http://localhost:5000/uploads/${dataUserSettings.profilePicture}`);
        setDescription(dataUserSettings.description || '');
        setPronouns(dataUserSettings.pronouns || '');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [user.username]);
  

  const selectProfilePicture = (filename) => {
    setProfilePicture(filename);
    setPreviewImage(`http://localhost:5000/uploads/${filename}`);
  };

  const handleColorChange = (e) => {
    setUsernameColor(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = {
      profilePicture,
      usernameColor,
      description,
      pronouns
    };

    try {
      const response = await fetch('http://localhost:5000/user/updateSettings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings: ' + response.status);
      }

      const data = await response.json();
      console.log('Settings updated successfully:', data);
      updateUser({
        ...user,
        profilePicture: body.profilePicture,
        usernameColor: body.usernameColor,
        description: body.description,
        pronouns: body.pronouns
      });

    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      {previewImage && (
        <img 
          src={previewImage} 
          alt="Profile Preview" 
          className="profile-picture-preview"
          style={{ borderColor: usernameColor }}
        />
      )}

      <div className="profile-pictures-container">
        {availablePfps.map(pfp => (
          <img
            key={pfp}
            src={`http://localhost:5000/uploads/${pfp}`}
            alt="Profile Picture"
            onClick={() => selectProfilePicture(pfp)}
            className={`profile-picture-option ${profilePicture === pfp ? 'active' : ''}`}
            style={{
              borderColor: profilePicture === pfp ? usernameColor : 'transparent',
            }}
          />
        ))}
      </div>

      <input type="color" value={usernameColor} onChange={handleColorChange} className="settings-color-picker" />

      <label>
        Description:
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label>
        Pronouns:
        <input type="text" value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
      </label>

      <button type="submit" className="settings-submit-button">Update Settings</button>
      <NavigationButton pathToNavigateTo="/chat" buttonText="Back to Chat" className="nav-settings" />
    </form>
  );
}

export default UserSettings;
