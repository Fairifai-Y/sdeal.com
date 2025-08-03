import React from 'react';
import CountryCard from '../components/CountryCard';
import './Home.css';

const Home = () => {
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
    <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
      
      {/* Country Section */}
      <div className="w3-container w3-padding-32" id="country">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          Choose Your Country
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
          About SDeal
        </h3>
        <p>
          SDeal connects retailers and wholesalers with consumers through high-quality online marketing expertise. 
          Our IT platform is continually evolving to help our partners boost their sales and maintain full control over their orders and customer data.
        </p>
        <p>
          Unlike large e-commerce players who dominate and take over the full customer journey, SDeal empowers partners to grow while staying in control. 
          We offer independent support and marketing power—without becoming your competitor.
        </p>
      </div>

      {/* Contact Section */}
      <div className="w3-container w3-padding-32" id="contact">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          Contact
        </h3>
        <p>
          <strong>Sales:</strong> <a href="mailto:sales@sdeal.com">sales@sdeal.com</a><br />
          <strong>Jobs:</strong> <a href="mailto:jobs@sdeal.com">jobs@sdeal.com</a>
        </p>
      </div>
    </div>
  );
};

export default Home; 