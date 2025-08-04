// Language codes and their corresponding URL prefixes
export const languageConfig = {
  en: { prefix: '', name: 'English', flag: '🇬🇧', code: 'EN' },
  nl: { prefix: '/nl', name: 'Nederlands', flag: '🇳🇱', code: 'NL' },
  de: { prefix: '/de', name: 'Deutsch', flag: '🇩🇪', code: 'DE' },
  fr: { prefix: '/fr', name: 'Français', flag: '🇫🇷', code: 'FR' }
};

// Get language from URL path
export const getLanguageFromPath = (pathname) => {
  const path = pathname.toLowerCase();
  
  // Check for non-English languages first (they have prefixes)
  for (const [lang, config] of Object.entries(languageConfig)) {
    if (lang !== 'en' && config.prefix) {
      // Check if path starts with the prefix (with or without trailing slash)
      if (path === config.prefix || path.startsWith(config.prefix + '/')) {
        return lang;
      }
    }
  }
  
  // If no language prefix found, it's English
  return 'en';
};

// Get path without language prefix
export const getPathWithoutLanguage = (pathname) => {
  // Remove all language prefixes from the path
  for (const [lang, config] of Object.entries(languageConfig)) {
    if (lang !== 'en' && config.prefix && pathname.startsWith(config.prefix)) {
      const pathWithoutPrefix = pathname.substring(config.prefix.length);
      return pathWithoutPrefix || '/';
    }
  }
  return pathname;
};

// Generate URL for specific language
export const getLocalizedUrl = (path, language) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const prefix = languageConfig[language].prefix;
  
  if (language === 'en') {
    return cleanPath;
  }
  
  const result = `${prefix}${cleanPath}`;
  return result;
};

// Get all language URLs for current page
export const getAllLanguageUrls = (currentPath) => {
  const urls = {};
  
  try {
    // Safety check for currentPath
    if (!currentPath) {
      currentPath = '/';
    }
    
    const pathWithoutLang = getPathWithoutLanguage(currentPath);
    
    if (languageConfig && typeof languageConfig === 'object') {
      Object.keys(languageConfig).forEach(lang => {
        if (lang) {
          urls[lang] = getLocalizedUrl(pathWithoutLang, lang);
        }
      });
    }
  } catch (error) {
    console.warn('Error in getAllLanguageUrls:', error);
    // Return default URLs if there's an error
    return {
      en: '/',
      nl: '/nl',
      de: '/de',
      fr: '/fr'
    };
  }
  
  return urls;
}; 