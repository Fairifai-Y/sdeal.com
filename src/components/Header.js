import React from 'react';
import { Link } from 'react-router-dom';
// Logo wordt geladen vanuit de public/images directory
import './Header.css';

const Header = () => {
  return (
    <div className="w3-top">
      <div className="w3-bar w3-white w3-wide w3-padding w3-card">
        <Link to="/" className="w3-bar-item">
          <img src="/images/sdeal Logo-01.jpg" alt="SDeal Logo" className="navbar-logo" />
        </Link>
        <div className="w3-right w3-hide-small">
          <a href="#about" className="w3-bar-item w3-button">About</a>
          <a href="#contact" className="w3-bar-item w3-button">Contact</a>
          <Link to="/connections" className="w3-bar-item w3-button">Connections</Link>
        </div>
      </div>
    </div>
  );
};

export default Header; 