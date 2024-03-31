import React, { useState, useEffect } from 'react';
import NavigationButton from './NavigationButton';

function UserSettings() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [usernameColor, setUsernameColor] = useState('#000000');
  const [availablePfps, setAvailablePfps] = useState([]);
  const [token, setToken] = useState(""); // State to hold the token

  useEffect(() => {
    // Fetch token from localStorage after component mounts
    const fetchedToken = localStorage.getItem('token');
    if (fetchedToken) {
      setToken(fetchedToken);
    } else {
      console.error('No token found in storage');
    }

    // Fetch available profile pictures
    const fetchAvailablePfps = async () => {
      try {
        const response = await fetch('http://localhost:5000/available-profile-pictures');
        if (!response.ok) {
          throw new Error('Failed to fetch available profile pictures');
        }
        const data = await response.json();
        setAvailablePfps(data);
      } catch (error) {
        console.error('Error fetching available profile pictures:', error);
      }
    };

    fetchAvailablePfps();
  }, []);

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
      profilePicture: profilePicture,
      usernameColor: usernameColor,
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
      console.log(data.message);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // Fetch user settings whenever token changes
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!token) {
        console.error('No token available');
        return;
      }
  
      try {
        const username = localStorage.getItem('username'); // Assuming username is stored in localStorage
        const response = await fetch(`http://localhost:5000/user/${username}/settings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        setUsernameColor(data.usernameColor);
        setPreviewImage(`http://localhost:5000/uploads/${data.profilePicture}`);
        console.log("Fetched settings:", data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
  
    fetchUserSettings();
  }, [token]);
  
  return (
    <form onSubmit={handleSubmit}>
      {previewImage && (
        <img 
          src={previewImage} 
          alt="Profile Preview" 
          style={{ width: '100px', height: '100px' }} 
        />
      )}

      <div>
        {availablePfps.map(pfp => (
          <img
            key={pfp}
            src={`http://localhost:5000/uploads/${pfp}`}
            alt={`Profile Picture`}
            onClick={() => selectProfilePicture(pfp)}
            style={{ width: '100px', height: '100px', cursor: 'pointer', margin: '10px' }}
          />
        ))}
      </div>

      <input type="color" value={usernameColor} onChange={handleColorChange} />
      <button type="submit">Update Settings</button>
      <NavigationButton pathToNavigateTo="/chat" buttonText="Back to Chat" />
    </form>
  );
}

export default UserSettings;
