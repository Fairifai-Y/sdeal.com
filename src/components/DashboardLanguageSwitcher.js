import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './DashboardLanguageSwitcher.css';

const LANGUAGES = [
  { code: 'en', labelKey: 'english' },
  { code: 'nl', labelKey: 'dutch' },
  { code: 'de', labelKey: 'german' },
  { code: 'fr', labelKey: 'french' },
];

const getLanguageCode = (lang) => ({ en: 'EN', nl: 'NL', de: 'DE', fr: 'FR' }[lang] || 'EN');

export default function DashboardLanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="dashboard-lang-switcher" ref={containerRef}>
      <button
        type="button"
        className="dashboard-lang-btn"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Taal kiezen"
      >
        <span className="dashboard-lang-code">{getLanguageCode(currentLanguage)}</span>
        <svg className="dashboard-lang-chevron" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>
      <div className={`dashboard-lang-dropdown ${isOpen ? 'dashboard-lang-dropdown--open' : ''}`} role="listbox">
        {LANGUAGES.map(({ code, labelKey }) => (
          <button
            key={code}
            type="button"
            className="dashboard-lang-option"
            onClick={() => handleSelect(code)}
            role="option"
            aria-selected={currentLanguage === code}
          >
            <span className="dashboard-lang-option-code">{getLanguageCode(code)}</span>
            <span className="dashboard-lang-option-name">{getTranslation(currentLanguage, labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
