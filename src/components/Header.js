import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Header.css';

const Header = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  const getLanguageFlag = (lang) => {
    const flags = {
      en: '🇬🇧',
      nl: '🇳🇱',
      de: '🇩🇪',
      fr: '🇫🇷'
    };
    return flags[lang] || '🇬🇧';
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
  };

  return (
    <div className="w3-top">
      <div className="w3-bar w3-white w3-wide w3-padding w3-card">
                            <Link to="/" className="w3-bar-item">
                      <img src="/images/logo_sdeal_navbar.svg" alt="SDeal Logo" className="navbar-logo" />
                    </Link>
        <div className="nav-links w3-hide-small">
          <a href="#about" className="w3-bar-item w3-button">{getTranslation(currentLanguage, 'about')}</a>
          <a href="#contact" className="w3-bar-item w3-button">{getTranslation(currentLanguage, 'contact')}</a>
          <Link to="/connections" className="w3-bar-item w3-button">{getTranslation(currentLanguage, 'connections')}</Link>
          <div className="language-selector">
            <button className="language-btn">
              <span className="flag-emoji">{getLanguageFlag(currentLanguage)}</span>
              <span className="language-text">{getLanguageCode(currentLanguage)}</span>
            </button>
            <div className="language-dropdown">
              <a href="#" className="language-option" onClick={(e) => { e.preventDefault(); handleLanguageChange('en'); }}>
                <span className="flag-emoji">🇬🇧</span>
                <span>{getTranslation(currentLanguage, 'english')}</span>
              </a>
              <a href="#" className="language-option" onClick={(e) => { e.preventDefault(); handleLanguageChange('nl'); }}>
                <span className="flag-emoji">🇳🇱</span>
                <span>{getTranslation(currentLanguage, 'dutch')}</span>
              </a>
              <a href="#" className="language-option" onClick={(e) => { e.preventDefault(); handleLanguageChange('de'); }}>
                <span className="flag-emoji">🇩🇪</span>
                <span>{getTranslation(currentLanguage, 'german')}</span>
              </a>
              <a href="#" className="language-option" onClick={(e) => { e.preventDefault(); handleLanguageChange('fr'); }}>
                <span className="flag-emoji">🇫🇷</span>
                <span>{getTranslation(currentLanguage, 'french')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 