export const translations = {
  en: {
    // Navigation
    about: 'About',
    contact: 'Contact',
    connections: 'Connections',
    
    // Home page
    welcome: 'Welcome to SDeal',
    subtitle: 'Your trusted marketplace across Europe',
    visitCountry: 'Visit SDeal',
    
    // Footer
    privacyPolicy: 'Privacy Policy',
    termsConditions: 'Terms & Conditions',
    jobs: 'Jobs',
    
    // Language names
    english: 'English',
    dutch: 'Dutch',
    german: 'German',
    french: 'French',
  },
  
  nl: {
    // Navigation
    about: 'Over ons',
    contact: 'Contact',
    connections: 'Verbindingen',
    
    // Home page
    welcome: 'Welkom bij SDeal',
    subtitle: 'Uw vertrouwde marktplaats in heel Europa',
    visitCountry: 'Bezoek SDeal',
    
    // Footer
    privacyPolicy: 'Privacybeleid',
    termsConditions: 'Algemene voorwaarden',
    jobs: 'Vacatures',
    
    // Language names
    english: 'Engels',
    dutch: 'Nederlands',
    german: 'Duits',
    french: 'Frans',
  },
  
  de: {
    // Navigation
    about: 'Über uns',
    contact: 'Kontakt',
    connections: 'Verbindungen',
    
    // Home page
    welcome: 'Willkommen bei SDeal',
    subtitle: 'Ihr vertrauenswürdiger Marktplatz in ganz Europa',
    visitCountry: 'SDeal besuchen',
    
    // Footer
    privacyPolicy: 'Datenschutz',
    termsConditions: 'Allgemeine Geschäftsbedingungen',
    jobs: 'Stellenangebote',
    
    // Language names
    english: 'Englisch',
    dutch: 'Niederländisch',
    german: 'Deutsch',
    french: 'Französisch',
  },
  
  fr: {
    // Navigation
    about: 'À propos',
    contact: 'Contact',
    connections: 'Connexions',
    
    // Home page
    welcome: 'Bienvenue chez SDeal',
    subtitle: 'Votre place de marché de confiance à travers l\'Europe',
    visitCountry: 'Visiter SDeal',
    
    // Footer
    privacyPolicy: 'Politique de confidentialité',
    termsConditions: 'Conditions générales',
    jobs: 'Emplois',
    
    // Language names
    english: 'Anglais',
    dutch: 'Néerlandais',
    german: 'Allemand',
    french: 'Français',
  }
};

export const getTranslation = (language, key) => {
  return translations[language]?.[key] || translations.en[key] || key;
}; 