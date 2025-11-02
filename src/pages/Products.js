import React from 'react';
import SEOHead from '../components/SEOHead';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Products.css';

const Products = () => {
  const { currentLanguage } = useLanguage();

  return (
    <>
      <SEOHead 
        title="Products - SDeal"
        description="Discover our products and services"
        keywords="SDeal, products, marketplace, services"
      />
      <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
        <div className="w3-container w3-padding-16">
          <h1 className="w3-border-bottom w3-border-light-grey w3-padding-16">
            {getTranslation(currentLanguage, 'products')}
          </h1>
          
          <div className="products-content">
            <p>Products content coming soon...</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Products;

