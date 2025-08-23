import React, { useState } from 'react';
import SEOHead from '../components/SEOHead';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Partners.css';

const Partners = () => {
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



  const partners = [
    {
      name: 'Fairifai',
      url: 'https://www.fairifai.com',
      image: '/images/AI_logo.png',
      description: {
        en: 'Online reviews are rarely neutral. Fairifai analyzes reviews using AI and gives you an honest, substantive and reliable picture. AI-driven review partner that gives the seller the rating they truly deserve.',
        nl: 'Online reviews zijn zelden neutraal. Fairifai analyseert reviews met behulp van AI en geeft jou een eerlijk, inhoudelijk en betrouwbaar beeld. AI gedreven review partner die de verkoper de beoordeling geeft die het echt verdient.',
        de: 'Online-Bewertungen sind selten neutral. Fairifai analysiert Bewertungen mit Hilfe von KI und gibt Ihnen ein ehrliches, inhaltliches und zuverlässiges Bild. KI-gesteuerter Review-Partner, der dem Verkäufer die Bewertung gibt, die er wirklich verdient.',
        fr: 'Les avis en ligne sont rarement neutres. Fairifai analyse les avis à l\'aide de l\'IA et vous donne une image honnête, substantielle et fiable. Partenaire d\'avis alimenté par l\'IA qui donne au vendeur la note qu\'il mérite vraiment.'
      },
      category: {
        en: 'AI & Reviews',
        nl: 'AI & Reviews',
        de: 'KI & Bewertungen',
        fr: 'IA & Avis'
      }
    },
    {
      name: 'Thuiswinkel Waarborg',
      url: 'https://www.thuiswinkel.org',
      image: '/images/logo-thuiswinkel_waarborg.svg',
      description: {
        en: 'As a certified member of Thuiswinkel Waarborg, we ensure secure and reliable online shopping experiences for our customers with guaranteed buyer protection.',
        nl: 'Als gecertificeerd lid van Thuiswinkel Waarborg zorgen we voor veilige en betrouwbare online winkelervaringen voor onze klanten met gegarandeerde kopersbescherming.',
        de: 'Als zertifiziertes Mitglied von Thuiswinkel Waarborg gewährleisten wir sichere und zuverlässige Online-Einkaufserlebnisse für unsere Kunden mit garantierter Käuferschutz.',
        fr: 'En tant que membre certifié de Thuiswinkel Waarborg, nous assurons des expériences d\'achat en ligne sécurisées et fiables pour nos clients avec une protection de l\'acheteur garantie.'
      },
      category: {
        en: 'Trust & Security',
        nl: 'Vertrouwen & Veiligheid',
        de: 'Vertrauen & Sicherheit',
        fr: 'Confiance & Sécurité'
      }
    },

    {
      name: 'Thuiswinkel Platform',
      url: 'https://www.thuiswinkel.org',
      image: '/images/logo-thuiswinkel_platform.svg',
      description: {
        en: 'Member of the Thuiswinkel Platform, representing the interests of online retailers and promoting fair e-commerce practices.',
        nl: 'Lid van het Thuiswinkel Platform, vertegenwoordigt de belangen van online retailers en bevordert eerlijke e-commerce praktijken.',
        de: 'Mitglied der Thuiswinkel Platform, vertritt die Interessen von Online-Händlern und fördert faire E-Commerce-Praktiken.',
        fr: 'Membre de la Plateforme Thuiswinkel, représentant les intérêts des détaillants en ligne et promouvant des pratiques e-commerce équitables.'
      },
      category: {
        en: 'Industry Association',
        nl: 'Branchevereniging',
        de: 'Branchenverband',
        fr: 'Association de l\'Industrie'
      }
    }
  ];

  return (
    <div className="partners-container">
      <SEOHead 
        description="Discover SDeal's trusted partners including Fairifai AI review analysis and Thuiswinkel certification. Partner with us for reliable e-commerce solutions."
        keywords="SDeal partners, Fairifai, Thuiswinkel, AI reviews, e-commerce partnerships, trusted marketplace partners"
      />
      <div className="w3-content w3-padding-64">
        <div className="partners-header">
          <h1 className="w3-center">
            {getTranslation(currentLanguage, 'partners')}
          </h1>
          <div className="language-indicator">
            <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="language-name">{getLanguageName(currentLanguage)}</span>
          </div>
        </div>
        
        <div className="partners-intro">
          <p className="w3-center w3-large">
            {getTranslation(currentLanguage, 'partnersIntro')}
          </p>
        </div>

        <div className="partners-grid">
          {partners.map((partner, index) => (
            <div key={index} className="partner-card">
              <div className="partner-header">
                <a href={partner.url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={partner.image} 
                    alt={partner.name} 
                    className="partner-logo"
                    onError={() => handleImageError(partner.name)}
                  />
                </a>
                <span className="partner-category">{partner.category[currentLanguage] || partner.category.en}</span>
              </div>
              <h4>{partner.name}</h4>
              <p>{partner.description[currentLanguage] || partner.description.en}</p>
              <a 
                href={partner.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="partner-link"
              >
                {getTranslation(currentLanguage, 'visitPartner')} →
              </a>
            </div>
          ))}
        </div>

        <div className="partnership-info">
                      <h4>{getTranslation(currentLanguage, 'interestedPartnership')}</h4>
            <p>
              {getTranslation(currentLanguage, 'partnershipDescription')}
          </p>
          <Link to="/contact" className="w3-button w3-orange partnership-contact-btn">
            <svg className="contact-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            {currentLanguage === 'nl' ? 'Neem Contact Op voor Partner Mogelijkheden' : 
             currentLanguage === 'de' ? 'Kontaktieren Sie uns für Partner-Möglichkeiten' :
             currentLanguage === 'fr' ? 'Contactez-nous pour les Opportunités de Partenariat' :
             'Contact Us for Partnership Opportunities'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Partners; 