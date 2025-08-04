import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Contact.css';

const Contact = () => {
  const { currentLanguage } = useLanguage();

  const contactData = [
    {
      id: 1,
      name: 'Rik',
      role: 'SDeal Seller Support',
      description: 'Schedule a call with Rik for SDeal seller support and assistance.',
      scheduleUrl: 'https://csbv.pipedrive.com/scheduler/6mxmLlUp/call-sdeal-rik',
      image: '/images/rik-avatar.jpg' // Placeholder - you can add actual images later
    },
    {
      id: 2,
      name: 'Yuri',
      role: 'Fairifai Information',
      description: 'Schedule a call with Yuri to learn more about Fairifai and our AI solutions.',
      scheduleUrl: 'https://csbv.pipedrive.com/scheduler/7aGa2PCB/call-sdeal-yuri',
      image: '/images/yuri-avatar.jpg' // Placeholder - you can add actual images later
    }
  ];

  return (
    <div className="contact-container">
      <div className="w3-content w3-padding-64">
        <h1 className="w3-center">
          {getTranslation('contact', currentLanguage)}
        </h1>
        
        <div className="contact-intro">
          <p className="w3-center w3-large">
            {getTranslation('contactIntro', currentLanguage)}
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
                <h4 className="contact-role">{contact.role}</h4>
                <p className="contact-description">{contact.description}</p>
                
                <a 
                  href={contact.scheduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="schedule-button"
                >
                  <i className="fa fa-calendar"></i>
                  {getTranslation('scheduleCall', currentLanguage)}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="contact-additional">
          <div className="w3-center w3-padding-32">
            <h3>{getTranslation('otherWays', currentLanguage)}</h3>
            <div className="contact-methods">
                             <div className="contact-method">
                 <i className="fa fa-envelope"></i>
                 <h4>{getTranslation('email', currentLanguage)}</h4>
                 <p>info@sdeal.com</p>
               </div>
               <div className="contact-method">
                 <i className="fa fa-phone"></i>
                 <h4>{getTranslation('phone', currentLanguage)}</h4>
                 <p>+31 (0) 50 123 4567</p>
               </div>
               <div className="contact-method">
                 <i className="fa fa-map-marker"></i>
                 <h4>{getTranslation('address', currentLanguage)}</h4>
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