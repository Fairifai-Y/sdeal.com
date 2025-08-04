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
  for (const [lang, config] of Object.entries(languageConfig)) {
    if (path.startsWith(config.prefix)) {
      return lang;
    }
  }
  return 'en'; // Default to English
};

// Get path without language prefix
export const getPathWithoutLanguage = (pathname) => {
  const language = getLanguageFromPath(pathname);
  const prefix = languageConfig[language].prefix;
  
  if (prefix && pathname.startsWith(prefix)) {
    return pathname.substring(prefix.length) || '/';
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
  
  return `${prefix}${cleanPath}`;
};

// Get all language URLs for current page
export const getAllLanguageUrls = (currentPath) => {
  const urls = {};
  
  // Safety check for currentPath
  if (!currentPath) {
    currentPath = '/';
  }
  
  const pathWithoutLang = getPathWithoutLanguage(currentPath);
  
  Object.keys(languageConfig).forEach(lang => {
    urls[lang] = getLocalizedUrl(pathWithoutLang, lang);
  });
  
  return urls;
}; 