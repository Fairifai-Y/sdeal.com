import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLanguageFromPath, getLocalizedUrl, getPathWithoutLanguage } from '../utils/languageUtils';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const location = useLocation();
  const navigate = useNavigate();

  // Load language from URL or localStorage on component mount
  useEffect(() => {
    const urlLanguage = getLanguageFromPath(location.pathname);
    const savedLanguage = localStorage.getItem('sdeal-language');
    
    // Priority: URL > localStorage > default (en)
    const language = urlLanguage || savedLanguage || 'en';
    setCurrentLanguage(language);
    
    // Update localStorage if different from URL
    if (language !== savedLanguage) {
      localStorage.setItem('sdeal-language', language);
    }
  }, [location.pathname]);

  // Change language and update URL
  const changeLanguage = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('sdeal-language', language);
    
    // Update URL to reflect new language
    const currentPath = getPathWithoutLanguage(location.pathname);
    const newUrl = getLocalizedUrl(currentPath, language);
    navigate(newUrl, { replace: true });
  };

  const value = {
    currentLanguage,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 