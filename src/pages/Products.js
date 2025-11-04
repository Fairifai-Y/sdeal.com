import React from 'react';
import SEOHead from '../components/SEOHead';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import ProductCard from '../components/ProductCard';
import './Products.css';

const Products = () => {
  const { currentLanguage } = useLanguage();

  const products = [
    {
      id: 1,
      title: getTranslation(currentLanguage, 'marketplace'),
      description: getTranslation(currentLanguage, 'marketplaceDesc'),
      icon: '🛒'
    },
    {
      id: 2,
      title: getTranslation(currentLanguage, 'dealCSS'),
      description: getTranslation(currentLanguage, 'dealCSSDesc'),
      icon: '🎯'
    },
    {
      id: 3,
      title: getTranslation(currentLanguage, 'cpc'),
      description: getTranslation(currentLanguage, 'cpcDesc'),
      icon: '💰'
    },
    {
      id: 4,
      title: getTranslation(currentLanguage, 'reviewFairifAI'),
      description: getTranslation(currentLanguage, 'reviewFairifAIDesc'),
      icon: '⭐'
    },
    {
      id: 5,
      title: getTranslation(currentLanguage, 'magentoDevelopment'),
      description: getTranslation(currentLanguage, 'magentoDevelopmentDesc'),
      icon: '⚙️'
    },
    {
      id: 6,
      title: getTranslation(currentLanguage, 'ownMagentoStore'),
      description: getTranslation(currentLanguage, 'ownMagentoStoreDesc'),
      icon: '🏪'
    }
  ];

  return (
    <>
      <SEOHead 
        title="Products - SDeal"
        description="Discover our products and services"
        keywords="SDeal, products, marketplace, services"
      />
      <div className="w3-content w3-padding" style={{ maxWidth: '1564px', marginTop: '64px' }}>
        <div className="w3-container w3-padding-16">
          <h1 className="w3-border-bottom w3-border-light-grey w3-padding-16">
            {getTranslation(currentLanguage, 'products')}
          </h1>
          
          <p className="products-intro">
            {getTranslation(currentLanguage, 'productsIntro')}
          </p>
          
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Products;

