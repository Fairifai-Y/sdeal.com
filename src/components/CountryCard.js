import React, { useState } from 'react';
import './CountryCard.css';

const CountryCard = ({ country }) => {
  const [imageError, setImageError] = useState(false);
  
  // Fallback afbeelding voor landen zonder afbeelding
  const getFallbackImage = (countryName) => {
    const colors = {
      'Italy': '#009246',
      'Denmark': '#C8102E', 
      'Austria': '#ED2939'
    };
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="200" fill="${colors[countryName] || '#ED8F47'}"/>
        <text x="150" y="100" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">${countryName}</text>
        <text x="150" y="130" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">Coming Soon</text>
      </svg>
    `)}`;
  };

  return (
    <div className="w3-display-container country-card">
      <div className="country-card-overlay">
        <div className="country-name">
          <h3>{country.name}</h3>
          <div className="country-flag-placeholder">
            <span className="flag-emoji">
              {country.name === 'Italy' ? '🇮🇹' : 
               country.name === 'Denmark' ? '🇩🇰' : 
               country.name === 'Austria' ? '🇦🇹' : '🏳️'}
            </span>
          </div>
        </div>
        <div className="country-actions">
          <a href={country.url} target="_blank" rel="noopener noreferrer" className="visit-button">
            Visit SDeal {country.name}
          </a>
        </div>
      </div>
      <img 
        src={imageError ? getFallbackImage(country.name) : country.image} 
        alt={`Visit SDeal ${country.name}`} 
        onError={() => setImageError(true)}
        className="country-image"
      />
    </div>
  );
};

export default CountryCard; 