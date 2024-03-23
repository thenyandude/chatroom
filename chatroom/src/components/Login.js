// src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate instead of useHistory

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // useNavigate hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        // If the HTTP status code is not OK, throw an error with the status text
        throw new Error(`${response.status}: ${response.statusText}`);
      }
  
      // Parse the JSON response only once
      const data = await response.json();
      console.log('Login successful', data);
  
      // Proceed with login success logic, like storing the user and navigating
      localStorage.setItem('username', username);
      navigate('/chat');
  
    } catch (error) {
      // If an error occurs, log it and show an alert
      console.error('Error during login:', error);
      alert('Error during login: ' + error.message);
    }
  };
  
  

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
      </form>

      <button onClick={() => navigate('/register')}>Need an account?</button>

    </div>
  );
}

export default Login;
