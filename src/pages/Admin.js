import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple password check - you can change this password
    const adminPassword = 'SDeal2024!'; // Change this to your desired password
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="admin-login">
          <h1>Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
        
        <div className="admin-content">
          <div className="admin-section">
            <h2>Welcome to the Admin Panel</h2>
            <p>This is a protected admin area. You can add admin functionality here.</p>
            
            <div className="admin-stats">
              <div className="stat-card">
                <h3>Quick Actions</h3>
                <ul>
                  <li>View analytics</li>
                  <li>Manage content</li>
                  <li>User management</li>
                  <li>Settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

