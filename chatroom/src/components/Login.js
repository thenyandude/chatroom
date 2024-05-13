import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationButton from './NavigationButton';
import '../css/AuthForm.css'


function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    } else{
      navigate("/chat")
    }

      localStorage.setItem('username', username);
      localStorage.setItem('isAdmin', data.isAdmin); // Assuming isAdmin is sent from the server
      localStorage.setItem('token', data.token); // Assuming token is sent from the server

      navigate('/chat');
    } catch (error) {
      console.error('Error during login:', error);
      setError(error.message || 'An error occurred during login');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      <NavigationButton pathToNavigateTo="/register" buttonText="Need an account?" className="nav-auth" />
    </div>
  );
}

export default Login;
