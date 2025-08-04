import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Header.css';

const Header = () => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 70, right: 20 });
  const languageBtnRef = useRef(null);

  const getLanguageFlag = (lang) => {
    const flags = {
      en: '/images/uk_flag.svg',
      nl: 'https://www.sdeal.nl/media/images/Nederlandse_vlag.png',
      de: 'https://www.sdeal.nl/media/images/duitse_vlag.png',
      fr: 'https://www.sdeal.nl/media/images/franse_vlag.png'
    };
    return flags[lang] || '/images/uk_flag.svg';
  };

  const handleImageError = (event) => {
    // Fallback to PNG if SVG fails to load
    if (event.target.src.includes('uk_flag.svg')) {
      event.target.src = '/images/unitedkingdom.png';
    }
  };

  const getLanguageCode = (lang) => {
    const codes = {
      en: 'EN',
      nl: 'NL',
      de: 'DE',
      fr: 'FR'
    };
    return codes[lang] || 'EN';
  };

  const handleLanguageChange = (language) => {
    changeLanguage(language);
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen && languageBtnRef.current) {
      // Calculate position when opening dropdown
      const rect = languageBtnRef.current.getBoundingClientRect();
      const top = rect.bottom + 5;
      const right = window.innerWidth - rect.right;
      setDropdownPosition({ top, right });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.language-selector')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="w3-top">
      <div className="w3-bar w3-white w3-padding">
        <Link to="/" className="w3-bar-item w3-button w3-padding-large">
          <img src="/images/logo_sdeal_navbar.svg" alt="SDeal Logo" className="navbar-logo" />
        </Link>
        <div className="nav-links w3-hide-small">
          <button className="w3-bar-item w3-button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
            {getTranslation(currentLanguage, 'about')}
          </button>
          <button className="w3-bar-item w3-button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
            {getTranslation(currentLanguage, 'contact')}
          </button>
          <Link to="/connections" className="w3-bar-item w3-button">
            {getTranslation(currentLanguage, 'connections')}
          </Link>
          <div className="language-selector">
            <button 
              ref={languageBtnRef}
              className="language-btn" 
              onClick={toggleDropdown}
            >
              <img src={getLanguageFlag(currentLanguage)} alt="Flag" className="flag-image" onError={handleImageError} />
              <span className="language-text">{getLanguageCode(currentLanguage)}</span>
            </button>
            <div 
              className={`language-dropdown ${isDropdownOpen ? 'open' : ''}`}
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
              }}
            >
              <button className="language-option" onClick={() => handleLanguageChange('en')}>
                <img src="/images/uk_flag.svg" alt="UK Flag" className="flag-image" onError={handleImageError} />
                <span>English</span>
              </button>
              <button className="language-option" onClick={() => handleLanguageChange('nl')}>
                <img src="https://www.sdeal.nl/media/images/Nederlandse_vlag.png" alt="NL Flag" className="flag-image" onError={handleImageError} />
                <span>Nederlands</span>
              </button>
              <button className="language-option" onClick={() => handleLanguageChange('de')}>
                <img src="https://www.sdeal.nl/media/images/duitse_vlag.png" alt="DE Flag" className="flag-image" onError={handleImageError} />
                <span>Deutsch</span>
              </button>
              <button className="language-option" onClick={() => handleLanguageChange('fr')}>
                <img src="https://www.sdeal.nl/media/images/franse_vlag.png" alt="FR Flag" className="flag-image" onError={handleImageError} />
                <span>Français</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 