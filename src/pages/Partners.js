import React, { useState } from 'react';
import './Partners.css';

const Partners = () => {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (partnerName) => {
    setImageErrors(prev => ({
      ...prev,
      [partnerName]: true
    }));
  };

  const partners = [
    {
      name: 'Fairifai',
      url: 'https://www.fairifai.com',
      image: '/images/fairifai-logo.jpg',
      description: 'Fairifai is our trusted partner for AI-powered product recommendations and personalized shopping experiences. Together, we enhance customer engagement and increase conversion rates through intelligent product suggestions.',
      category: 'AI & Personalization'
    },
    {
      name: 'Thuiswinkel Waarborg',
      url: 'https://www.thuiswinkel.org',
      image: '/images/logo-thuiswinkel_waarborg.svg',
      description: 'As a certified member of Thuiswinkel Waarborg, we ensure secure and reliable online shopping experiences for our customers with guaranteed buyer protection.',
      category: 'Trust & Security'
    },
    {
      name: 'Shopping Secure',
      url: 'https://www.shoppingsecure.nl',
      image: '/images/logo-shopping_secure.svg',
      description: 'Shopping Secure certification guarantees that our platform meets the highest security standards for online payments and data protection.',
      category: 'Security & Compliance'
    },
    {
      name: 'Thuiswinkel Platform',
      url: 'https://www.thuiswinkel.org',
      image: '/images/logo-thuiswinkel_platform.svg',
      description: 'Member of the Thuiswinkel Platform, representing the interests of online retailers and promoting fair e-commerce practices.',
      category: 'Industry Association'
    }
  ];

  return (
    <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
      <div className="w3-container w3-padding-64">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          Our Trusted Partners
        </h3>
        <p>
          SDeal collaborates with industry-leading partners to provide the best possible experience for our customers. 
          These partnerships enable us to offer innovative solutions, enhanced security, and reliable services.
        </p>

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
                <span className="partner-category">{partner.category}</span>
              </div>
              <h4>{partner.name}</h4>
              <p>{partner.description}</p>
              <a 
                href={partner.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="partner-link"
              >
                Visit Partner →
              </a>
            </div>
          ))}
        </div>

        <div className="partnership-info">
          <h4>Interested in Partnership?</h4>
          <p>
            Are you interested in becoming a partner with SDeal? We're always looking for innovative companies 
            that share our vision of reliable and secure online shopping. Contact us to discuss partnership opportunities.
          </p>
          <a href="#contact" className="w3-button w3-orange">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default Partners; 