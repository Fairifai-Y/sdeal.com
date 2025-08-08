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
      image: '/images/image-1.jpg',
      flag: 'https://www.sdeal.nl/media/images/Nederlandse_vlag.png'
    },
    {
      name: 'Germany',
      url: 'https://www.sdeal.de',
      image: '/images/image-2.jpg',
      flag: 'https://www.sdeal.nl/media/images/duitse_vlag.png'
    },
    {
      name: 'France',
      url: 'https://www.sdeal.fr',
      image: '/images/image-3.jpg',
      flag: 'https://www.sdeal.nl/media/images/franse_vlag.png'
    },
    {
      name: 'Belgium',
      url: 'https://www.sdeal.be',
      image: '/images/image-4.jpg',
      flag: 'https://www.sdeal.nl/media/images/Belgie.png'
    },
    {
      name: 'Italy',
      url: 'https://www.sdeal.it',
      image: '/images/image-5.jpg',
      flag: 'https://www.sdeal.nl/media/images/Flag-IT.png'
    },
    {
      name: 'Denmark',
      url: 'https://www.sdeal.dk',
      image: '/images/image-6.jpg',
      flag: 'https://www.sdeal.nl/media/images/Flag-DK.png'
    },
    {
      name: 'Austria',
      url: 'https://www.sdeal.at',
      image: '/images/image-7.jpg',
      flag: 'https://www.sdeal.nl/media/images/Flag-AT.png'
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
          "url": typeof window !== 'undefined' ? window.location.origin : 'https://www.sdeal.com',
          "description": getTranslation(currentLanguage, 'subtitle'),
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${typeof window !== 'undefined' ? window.location.origin : 'https://www.sdeal.com'}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          },
          "sameAs": [
            "https://www.sdeal.nl",
            "https://www.sdeal.de", 
            "https://www.sdeal.fr",
            "https://www.sdeal.it",
            "https://www.sdeal.dk",
            "https://www.sdeal.at"
          ],
          "publisher": {
            "@type": "Organization",
            "name": "SDeal",
            "logo": {
              "@type": "ImageObject",
              "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://www.sdeal.com'}/images/logo_sdeal_navbar.svg`
            }
          }
        }}
      />
      <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
      
      {/* Country Section */}
      <div className="w3-container w3-padding-32" id="country">
        <div className="w3-row-padding">
          {countries.map((country, index) => (
            <div key={index} className="w3-col l3 m6 w3-margin-bottom">
              <CountryCard country={country} />
            </div>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div className="w3-container w3-padding-32" id="products">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          {getTranslation(currentLanguage, 'products')}
        </h3>
        <div className="w3-row-padding">
          <div className="w3-col l4 m6 w3-margin-bottom">
            <div className="w3-card w3-white w3-padding">
              <div className="w3-center">
                <i className="fa fa-shopping-cart w3-xxlarge"></i>
              </div>
              <h4 className="w3-center">{getTranslation(currentLanguage, 'marketplace')}</h4>
              <p className="w3-center">
                {getTranslation(currentLanguage, 'marketplaceDesc')}
              </p>
            </div>
          </div>
          <div className="w3-col l4 m6 w3-margin-bottom">
            <div className="w3-card w3-white w3-padding">
              <div className="w3-center">
                <i className="fa fa-chart-line w3-xxlarge"></i>
              </div>
              <h4 className="w3-center">{getTranslation(currentLanguage, 'analytics')}</h4>
              <p className="w3-center">
                {getTranslation(currentLanguage, 'analyticsDesc')}
              </p>
            </div>
          </div>
          <div className="w3-col l4 m6 w3-margin-bottom">
            <div className="w3-card w3-white w3-padding">
              <div className="w3-center">
                <i className="fa fa-users w3-xxlarge"></i>
              </div>
              <h4 className="w3-center">{getTranslation(currentLanguage, 'support')}</h4>
              <p className="w3-center">
                {getTranslation(currentLanguage, 'supportDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="w3-container w3-padding-32" id="about">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          {getTranslation(currentLanguage, 'about')}
        </h3>
        <div className="w3-row-padding">
          <div className="w3-col l6 m12 w3-margin-bottom">
            <div className="w3-card w3-white w3-padding">
              <div className="w3-center">
                <i className="fa fa-bullseye w3-xxlarge"></i>
              </div>
              <h4 className="w3-center">{getTranslation(currentLanguage, 'ourMission')}</h4>
              <p>
                {getTranslation(currentLanguage, 'aboutText')}
              </p>
            </div>
          </div>
          <div className="w3-col l6 m12 w3-margin-bottom">
            <div className="w3-card w3-white w3-padding">
              <div className="w3-center">
                <i className="fa fa-lightbulb w3-xxlarge"></i>
              </div>
              <h4 className="w3-center">{getTranslation(currentLanguage, 'ourApproach')}</h4>
              <p>
                {getTranslation(currentLanguage, 'aboutText2')}
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Home; 