import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    
    console.log('useEffect - URL language:', urlLanguage, 'Saved language:', savedLanguage, 'Final language:', language, 'Current language:', currentLanguage);
    
    // Only update if language is different and not already being set
    if (language !== currentLanguage) {
      console.log('Setting new language from useEffect:', language);
      setCurrentLanguage(language);
      
      // Update localStorage if different from URL
      if (language !== savedLanguage) {
        localStorage.setItem('sdeal-language', language);
      }
    }
  }, [location.pathname]);

  // Change language and update URL
  const changeLanguage = useCallback((language) => {
    console.log('Changing language from', currentLanguage, 'to', language);
    
    // Prevent changing to the same language
    if (currentLanguage === language) {
      console.log('Same language, no change needed');
      return;
    }
    
    // Update localStorage first
    localStorage.setItem('sdeal-language', language);
    
    // Update URL to reflect new language
    const currentPath = getPathWithoutLanguage(location.pathname);
    const newUrl = getLocalizedUrl(currentPath, language);
    
    console.log('Current path:', location.pathname, 'New URL:', newUrl);
    
    // Navigate to update the URL - let useEffect handle the state update
    navigate(newUrl, { replace: true });
  }, [currentLanguage, location.pathname, navigate]);

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