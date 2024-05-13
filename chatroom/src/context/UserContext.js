import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [userSettings, setUserSettings] = useState({
        username: '',
        pronouns: 'Not specified',
        description: 'No description provided.',
        profilePicture: 'default.png',
        usernameColor: '#000000'
    });

    const updateUserSettings = (updates) => {
        setUserSettings(prevSettings => ({ ...prevSettings, ...updates }));
    };

    return (
        <UserContext.Provider value={{ userSettings, updateUserSettings }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserSettings = () => useContext(UserContext);
