import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Initialize with language from URL or localStorage
    const urlLanguage = getLanguageFromPath(window.location.pathname);
    const savedLanguage = localStorage.getItem('sdeal-language');
    return urlLanguage || savedLanguage || 'en';
  });
  
  const location = useLocation();
  const navigate = useNavigate();
  const prevLanguageRef = useRef(currentLanguage);

  // Sync language with URL changes
  useEffect(() => {
    const urlLanguage = getLanguageFromPath(location.pathname);
    const savedLanguage = localStorage.getItem('sdeal-language');
    
    // Priority: URL > localStorage > default (en)
    const language = urlLanguage || savedLanguage || 'en';
    
    // Only update if the language has actually changed
    if (language !== prevLanguageRef.current) {
      setCurrentLanguage(language);
      prevLanguageRef.current = language;
      
      // Update localStorage if different from URL
      if (language !== savedLanguage) {
        localStorage.setItem('sdeal-language', language);
      }
    }
  }, [location.pathname]); // Only depend on pathname changes

  // Change language and update URL
  const changeLanguage = useCallback((language) => {
    // Prevent changing to the same language
    if (currentLanguage === language) {
      return;
    }
    
    // Update localStorage first
    localStorage.setItem('sdeal-language', language);
    
    // Update URL to reflect new language
    const currentPath = getPathWithoutLanguage(location.pathname);
    const newUrl = getLocalizedUrl(currentPath, language);
    
    // Navigate to update the URL
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