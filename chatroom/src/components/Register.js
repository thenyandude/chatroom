// src/Register.js
import React, { useState } from 'react';
import NavigationButton from './NavigationButton';
import { useNavigate } from 'react-router-dom';
import '../css/AuthForm.css'

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (username.toLowerCase() === "system") {
      alert('The username "System" is reserved and cannot be used.');
      return; // Stop the form submission
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        alert('User registered successfully');
        navigate("/login")
      } else {
        alert('Failed to register user');
      }
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Register</h2>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Register</button>
      </form>
      <NavigationButton pathToNavigateTo="/login" buttonText="Have an account?" className="nav-auth" />
    </div>
  );
}


export default Register;
