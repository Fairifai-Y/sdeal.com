import React from 'react';
import CountryCard from '../components/CountryCard';
import SEOHead from '../components/SEOHead';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Home.css';

const Home = () => {
  const { currentLanguage } = useLanguage();
  
  const countries = [
    {
      name: 'Netherlands',
      url: 'https://www.sdeal.nl',
      image: '/images/netherlands.png'
    },
    {
      name: 'Germany',
      url: 'https://www.sdeal.de',
      image: '/images/germany.png'
    },
    {
      name: 'France',
      url: 'https://www.sdeal.fr',
      image: '/images/france.png'
    },
    {
      name: 'Belgium',
      url: 'https://www.sdeal.be',
      image: '/images/belgium.png'
    },
    {
      name: 'Italy',
      url: 'https://www.sdeal.it',
      image: '/images/italy.png'
    },
    {
      name: 'Denmark',
      url: 'https://www.sdeal.dk',
      image: '/images/denmark.png'
    },
    {
      name: 'Austria',
      url: 'https://www.sdeal.at',
      image: '/images/austria.png'
    }
  ];

  return (
    <>
      <SEOHead 
        title={getTranslation(currentLanguage, 'welcome')}
        description={getTranslation(currentLanguage, 'subtitle')}
        keywords="SDeal, marketplace, Europe, online shopping, retail, wholesale"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "SDeal",
          "url": window.location.origin,
          "description": getTranslation(currentLanguage, 'subtitle'),
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        }}
      />
      <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
      
      {/* Country Section */}
      <div className="w3-container w3-padding-32" id="country">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          {getTranslation(currentLanguage, 'chooseCountry')}
        </h3>

        <div className="w3-row-padding">
          {countries.map((country, index) => (
            <div key={index} className="w3-col l3 m6 w3-margin-bottom">
              <CountryCard country={country} />
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="w3-container w3-padding-16" id="about">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          {getTranslation(currentLanguage, 'about')}
        </h3>
        <p>
          {getTranslation(currentLanguage, 'aboutText')}
        </p>
        <p>
          {getTranslation(currentLanguage, 'aboutText2')}
        </p>
      </div>

      {/* Contact Section */}
      <div className="w3-container w3-padding-32" id="contact">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          {getTranslation(currentLanguage, 'contact')}
        </h3>
        <p>
          <strong>Sales:</strong> <a href="mailto:sales@sdeal.com">sales@sdeal.com</a><br />
          <strong>Jobs:</strong> <a href="mailto:jobs@sdeal.com">jobs@sdeal.com</a>
        </p>
      </div>
      </div>
    </>
  );
};

export default Home; 