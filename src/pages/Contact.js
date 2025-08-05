import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Contact.css';

const Contact = () => {
  const { currentLanguage } = useLanguage();

  const getLanguageName = (lang) => {
    const names = {
      en: 'English',
      nl: 'Nederlands',
      de: 'Deutsch',
      fr: 'Français'
    };
    return names[lang] || 'English';
  };

  const contactData = [
    {
      id: 1,
      name: 'Rik',
      role: {
        en: 'SDeal Seller Support',
        nl: 'SDeal Verkoper Ondersteuning',
        de: 'SDeal Verkäufer Support',
        fr: 'Support Vendeur SDeal'
      },
      description: {
        en: 'Schedule a call with Rik for SDeal seller support and assistance. Available Monday to Friday.',
        nl: 'Plan een gesprek met Rik voor SDeal verkoper ondersteuning en hulp. Beschikbaar maandag t/m vrijdag.',
        de: 'Vereinbaren Sie einen Anruf mit Rik für SDeal Verkäufer-Support und Hilfe. Verfügbar Montag bis Freitag.',
        fr: 'Planifiez un appel avec Rik pour le support et l\'assistance des vendeurs SDeal. Disponible du lundi au vendredi.'
      },
      scheduleUrl: 'https://csbv.pipedrive.com/scheduler/6mxmLlUp/call-sdeal-rik',
      image: '/images/rik-avatar.jpg'
    },
    {
      id: 2,
      name: 'Yuri',
      role: {
        en: 'Fairifai Information',
        nl: 'Fairifai Informatie',
        de: 'Fairifai Informationen',
        fr: 'Informations Fairifai'
      },
      description: {
        en: 'Schedule a call with Yuri to learn more about Fairifai and our AI solutions. Available Thursday and Friday between 9 AM and 12 PM.',
        nl: 'Plan een gesprek met Yuri om meer te weten te komen over Fairifai en onze AI-oplossingen. Beschikbaar donderdag en vrijdag tussen 9u en 12u.',
        de: 'Vereinbaren Sie einen Anruf mit Yuri, um mehr über Fairifai und unsere KI-Lösungen zu erfahren. Verfügbar Donnerstag und Freitag zwischen 9 Uhr und 12 Uhr.',
        fr: 'Planifiez un appel avec Yuri pour en savoir plus sur Fairifai et nos solutions d\'IA. Disponible jeudi et vendredi entre 9h et 12h.'
      },
      scheduleUrl: 'https://csbv.pipedrive.com/scheduler/7aGa2PCB/call-sdeal-yuri',
      image: '/images/yuri-avatar.jpg'
    }
  ];

  const getEmailAddress = (lang) => {
    const emails = {
      en: 'customerservice@sdeal.com',
      nl: 'klantenservice@sdeal.com',
      de: 'kundenservice@sdeal.com',
      fr: 'service-client@sdeal.com'
    };
    return emails[lang] || emails.en;
  };

  return (
    <div className="contact-container">
      <div className="w3-content w3-padding-64">
        <div className="contact-header">
          <h1 className="w3-center">
            {getTranslation(currentLanguage, 'contact')}
          </h1>
          <div className="language-indicator">
            <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="language-name">{getLanguageName(currentLanguage)}</span>
          </div>
        </div>
        
        <div className="contact-intro">
          <p className="w3-center w3-large">
            {getTranslation(currentLanguage, 'contactIntro')}
          </p>
        </div>

        <div className="contact-cards">
          {contactData.map((contact) => (
            <div key={contact.id} className="contact-card">
              <div className="contact-avatar">
                <img 
                  src={contact.image} 
                  alt={`${contact.name} avatar`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="avatar-placeholder" style={{ display: 'none' }}>
                  {contact.name.charAt(0)}
                </div>
              </div>
              
              <div className="contact-info">
                <h3 className="contact-name">{contact.name}</h3>
                <h4 className="contact-role">{contact.role[currentLanguage] || contact.role.en}</h4>
                <p className="contact-description">{contact.description[currentLanguage] || contact.description.en}</p>
                
                <a 
                  href={contact.scheduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="schedule-button"
                >
                  <i className="fa fa-calendar"></i>
                  {getTranslation(currentLanguage, 'scheduleCall')}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="contact-additional">
          <div className="w3-center w3-padding-32">
            <h3>{getTranslation(currentLanguage, 'otherWays')}</h3>
            <div className="contact-methods">
              <div className="contact-method">
                <i className="fa fa-envelope"></i>
                <h4>{getTranslation(currentLanguage, 'email')}</h4>
                <p>{getEmailAddress(currentLanguage)}</p>
              </div>
              <div className="contact-method">
                <i className="fa fa-phone"></i>
                <h4>{getTranslation(currentLanguage, 'phone')}</h4>
                <p>+31 850 250 182</p>
              </div>
              <div className="contact-method">
                <i className="fa fa-map-marker"></i>
                <h4>{getTranslation(currentLanguage, 'address')}</h4>
                <p>SDeal BV<br />Osloweg 110<br />9723 BX Groningen<br />Netherlands</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 