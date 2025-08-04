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
    chooseCountry: 'Choose Your Country',
    aboutText: 'SDeal connects retailers and wholesalers with consumers through high-quality online marketing expertise. Our IT platform is continually evolving to help our partners boost their sales and maintain full control over their orders and customer data.',
    aboutText2: 'Unlike large e-commerce players who dominate and take over the full customer journey, SDeal empowers partners to grow while staying in control. We offer independent support and marketing power—without becoming your competitor.',
    
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
    chooseCountry: 'Kies uw land',
    aboutText: 'SDeal verbindt retailers en groothandelaren met consumenten door middel van hoogwaardige online marketing expertise. Ons IT-platform evolueert continu om onze partners te helpen hun verkopen te stimuleren en volledige controle te behouden over hun bestellingen en klantgegevens.',
    aboutText2: 'Anders dan grote e-commerce spelers die de volledige klantreis domineren en overnemen, geeft SDeal partners de mogelijkheid om te groeien terwijl ze de controle behouden. We bieden onafhankelijke ondersteuning en marketingkracht—zonder uw concurrent te worden.',
    
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
    chooseCountry: 'Wählen Sie Ihr Land',
    aboutText: 'SDeal verbindet Einzelhändler und Großhändler mit Verbrauchern durch hochwertige Online-Marketing-Expertise. Unsere IT-Plattform entwickelt sich kontinuierlich weiter, um unseren Partnern zu helfen, ihre Verkäufe zu steigern und die vollständige Kontrolle über ihre Bestellungen und Kundendaten zu behalten.',
    aboutText2: 'Anders als große E-Commerce-Akteure, die die gesamte Customer Journey dominieren und übernehmen, befähigt SDeal Partner zum Wachstum, während sie die Kontrolle behalten. Wir bieten unabhängige Unterstützung und Marketingkraft—ohne Ihr Konkurrent zu werden.',
    
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
    chooseCountry: 'Choisissez votre pays',
    aboutText: 'SDeal connecte les détaillants et les grossistes avec les consommateurs grâce à une expertise marketing en ligne de haute qualité. Notre plateforme informatique évolue continuellement pour aider nos partenaires à stimuler leurs ventes et maintenir un contrôle total sur leurs commandes et données clients.',
    aboutText2: 'Contrairement aux grands acteurs du e-commerce qui dominent et prennent le contrôle de tout le parcours client, SDeal permet aux partenaires de grandir tout en gardant le contrôle. Nous offrons un soutien indépendant et une puissance marketing—sans devenir votre concurrent.',
    
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