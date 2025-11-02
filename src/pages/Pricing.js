import React from 'react';
import SEOHead from '../components/SEOHead';
import './Pricing.css';

const Pricing = () => {
  return (
    <>
      <SEOHead 
        title="Pricing - SDeal"
        description="View our pricing plans"
        keywords="SDeal, pricing, plans, cost"
      />
      <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
        <div className="w3-container w3-padding-16">
          <h1 className="w3-border-bottom w3-border-light-grey w3-padding-16">
            Pricing
          </h1>
          
          <div className="pricing-content">
            <p>Pricing content coming soon...</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;

