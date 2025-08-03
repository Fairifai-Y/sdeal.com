import React from 'react';
import './CountryCard.css';

const CountryCard = ({ country }) => {
  return (
    <div className="w3-display-container country-card">
      <div className="w3-display-topleft w3-black w3-padding">
        <b>{country.name}</b>
      </div>
      <a href={country.url} target="_blank" rel="noopener noreferrer">
        <img 
          src={country.image} 
          alt={`Visit SDeal ${country.name}`} 
          style={{ width: '100%' }}
        />
      </a>
    </div>
  );
};

export default CountryCard; 