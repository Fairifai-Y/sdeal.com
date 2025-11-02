import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import FairifaiBadge from './FairifaiBadge';
import './Header.css';

const Header = () => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 70, right: 20 });
  const languageBtnRef = useRef(null);

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
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false); // Close mobile menu after language change
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen && languageBtnRef.current) {
      const rect = languageBtnRef.current.getBoundingClientRect();
      const top = rect.bottom + 5;
      const right = window.innerWidth - rect.right;
      setDropdownPosition({ top, right });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsDropdownOpen(false); // Close language dropdown when opening mobile menu
  };

  // Close dropdowns when clicking outside
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

  // Close mobile menu when clicking on a link
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="w3-top">
      <div className="w3-bar w3-white w3-padding">
        <Link to="/" className="w3-bar-item w3-button w3-padding-large">
          <img src="/images/logo_sdeal_navbar.svg" alt="SDeal Logo" className="navbar-logo" />
        </Link>
        
        {/* Desktop Navigation */}
        <div className="nav-links w3-hide-small">
          <FairifaiBadge />
          <Link to="/products" className="w3-bar-item w3-button">
            Products
          </Link>
          <Link to="/pricing" className="w3-bar-item w3-button">
            Pricing
          </Link>
          <button className="w3-bar-item w3-button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
            {getTranslation(currentLanguage, 'about')}
          </button>
          <Link to="/contact" className="w3-bar-item w3-button">
            {getTranslation(currentLanguage, 'contact')}
          </Link>
          <Link to="/connections" className="w3-bar-item w3-button">
            {getTranslation(currentLanguage, 'connections')}
          </Link>
          <Link to="/partners" className="w3-bar-item w3-button">
            {getTranslation(currentLanguage, 'partners')}
          </Link>
          <Link to="/faq" className="w3-bar-item w3-button">
            {getTranslation(currentLanguage, 'faq')}
          </Link>
          <div className="language-selector">
            <button 
              ref={languageBtnRef}
              className="language-btn" 
              onClick={toggleDropdown}
            >
              <span className="language-text">{getLanguageCode(currentLanguage)}</span>
              <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </button>
            <div 
              className={`language-dropdown ${isDropdownOpen ? 'open' : ''}`}
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
              }}
            >
              <button className="language-option" onClick={() => handleLanguageChange('en')}>
                <span>EN</span>
                <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span>English</span>
              </button>
              <button className="language-option" onClick={() => handleLanguageChange('nl')}>
                <span>NL</span>
                <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span>Nederlands</span>
              </button>
              <button className="language-option" onClick={() => handleLanguageChange('de')}>
                <span>DE</span>
                <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span>Deutsch</span>
              </button>
              <button className="language-option" onClick={() => handleLanguageChange('fr')}>
                <span>FR</span>
                <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span>Français</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="w3-bar-item w3-right w3-hide-large w3-hide-medium">
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>

             {/* Mobile Navigation Menu */}
       <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
         <div className="mobile-menu-content">
          <Link to="/products" className="mobile-menu-item" onClick={handleMobileLinkClick}>
            Products
          </Link>
          <Link to="/pricing" className="mobile-menu-item" onClick={handleMobileLinkClick}>
            Pricing
          </Link>
          <button className="mobile-menu-item" onClick={() => {
             document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
             handleMobileLinkClick();
           }}>
             {getTranslation(currentLanguage, 'about')}
           </button>
           <Link to="/contact" className="mobile-menu-item" onClick={handleMobileLinkClick}>
             {getTranslation(currentLanguage, 'contact')}
           </Link>
          <Link to="/connections" className="mobile-menu-item" onClick={handleMobileLinkClick}>
            {getTranslation(currentLanguage, 'connections')}
          </Link>
          <Link to="/partners" className="mobile-menu-item" onClick={handleMobileLinkClick}>
            {getTranslation(currentLanguage, 'partners')}
          </Link>
          <Link to="/faq" className="mobile-menu-item" onClick={handleMobileLinkClick}>
            {getTranslation(currentLanguage, 'faq')}
          </Link>
          
                     {/* Mobile Language Selector */}
           <div className="mobile-language-section">
             <h4>Language / Taal / Sprache / Langue</h4>
             <div className="mobile-language-options">
               <button className="mobile-language-option" onClick={() => handleLanguageChange('en')}>
                 <span className="language-code">EN</span>
                 <span className="language-name">English</span>
               </button>
               <button className="mobile-language-option" onClick={() => handleLanguageChange('nl')}>
                 <span className="language-code">NL</span>
                 <span className="language-name">Nederlands</span>
               </button>
               <button className="mobile-language-option" onClick={() => handleLanguageChange('de')}>
                 <span className="language-code">DE</span>
                 <span className="language-name">Deutsch</span>
               </button>
               <button className="mobile-language-option" onClick={() => handleLanguageChange('fr')}>
                 <span className="language-code">FR</span>
                 <span className="language-name">Français</span>
               </button>
             </div>
           </div>
           
           {/* Mobile Fairifai Badge */}
           <div className="mobile-fairifai-badge">
             <FairifaiBadge />
           </div>
         </div>
       </div>
    </div>
  );
};

export default Header; 