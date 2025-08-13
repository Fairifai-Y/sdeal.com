import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const countries = [
    { name: 'Netherlands', url: 'https://www.sdeal.nl', flag: 'https://www.sdeal.nl/media/images/Nederlandse_vlag.png' },
    { name: 'Germany', url: 'https://www.sdeal.de', flag: 'https://www.sdeal.nl/media/images/duitse_vlag.png' },
    { name: 'France', url: 'https://www.sdeal.fr', flag: 'https://www.sdeal.nl/media/images/franse_vlag.png' },
    { name: 'Belgium', url: 'https://www.sdeal.be', flag: 'https://www.sdeal.nl/media/images/Belgie.png' },
    { name: 'Austria', url: 'https://www.sdeal.at', flag: 'https://www.sdeal.nl/media/images/Flag-AT.png' },
    { name: 'Denmark', url: 'https://www.sdeal.dk', flag: 'https://www.sdeal.nl/media/images/Flag-DK.png' },
    { name: 'Italy', url: 'https://www.sdeal.it', flag: 'https://www.sdeal.nl/media/images/Flag-IT.png' }
  ];

  return (
    <footer className="w3-black w3-padding-48">
      <div className="w3-content" style={{ maxWidth: '1564px' }}>
        <div className="w3-row-padding w3-row">
          
          <div className="w3-col s12 m2 w3-margin-bottom">
            <h4>Service</h4>
            <ul className="w3-ul no-lines">
              <li><Link to="/faq" className="w3-hover-text-red">FAQ</Link></li>
              <li><Link to="/contact" className="w3-hover-text-red">Contact</Link></li>
            </ul>
          </div>

          <div className="w3-col s12 m2 w3-margin-bottom">
            <h4>Business</h4>
            <ul className="w3-ul no-lines">
              <li><a href="https://onboarding.sdeal.com" className="w3-hover-text-red" target="_blank" rel="noopener noreferrer">Sell on SDeal</a></li>
              <li><Link to="/connections" className="w3-hover-text-red">Connections</Link></li>
              <li><Link to="/partners" className="w3-hover-text-red">Partners</Link></li>

              <li><Link to="/jobs" className="w3-hover-text-red">Jobs</Link></li>
            </ul>
          </div>

          <div className="w3-col s12 m2 w3-margin-bottom">
            <h4>Trustmark</h4>
            <ul className="w3-ul no-lines">
              <li><a href="https://fairifai.com/site/sdeal.com/review" className="w3-hover-text-red" target="_blank" rel="noopener noreferrer">Customer Reviews</a></li>
              <li><a href="https://www.thuiswinkel.org/leden/sdeal/platformcertificaat/" className="w3-hover-text-red" target="_blank" rel="noopener noreferrer">Certifications</a></li>
              <li><Link to="/privacy-policy" className="w3-hover-text-red">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="w3-hover-text-red">Terms and conditions</Link></li>
            </ul>
          </div>

          <div className="w3-col s12 m2 w3-margin-bottom">
            <h4>Social</h4>
            <ul className="w3-ul no-lines">
              <li><a href="https://www.linkedin.com/company/sdeal" target="_blank" rel="noopener noreferrer" className="w3-hover-text-red">LinkedIn</a></li>
              <li><a href="https://www.instagram.com/sdeal.nl/" className="w3-hover-text-red" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="#" className="w3-hover-text-red">YouTube</a></li>
            </ul>
          </div>

          <div className="w3-col s12 m4 w3-margin-bottom">
            <h4>Countries</h4>
            <ul className="w3-ul no-lines">
              {countries.map((country, index) => (
                <li key={index}>
                  <a href={country.url} target="_blank" rel="noopener noreferrer">
                    <img src={country.flag} alt={country.name} className="country-flag" />
                    {country.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="w3-center w3-padding-24">
          <p>&copy; SDeal – Reliable Shopping</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 