import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;