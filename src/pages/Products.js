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
              <React.Fragment key={product.id}>
                <ProductCard product={product} />
                {product.id === 1 && (
                  <div className="marketplace-details">
                    <div className="marketplace-content">
                      {getTranslation(currentLanguage, 'marketplaceDetailed')
                        .split('\n')
                        .map((line, index) => {
                          if (line.trim() === '') return <br key={index} />;
                          if (index === 0) {
                            return <h2 key={index} className="marketplace-title">{line}</h2>;
                          }
                          return <p key={index} className="marketplace-paragraph">{line}</p>;
                        })}
                    </div>
                  </div>
                )}
                {product.id === 2 && (
                  <div className="marketplace-details">
                    <div className="marketplace-content">
                      {getTranslation(currentLanguage, 'dealCSSDetailed')
                        .split('\n')
                        .map((line, index) => {
                          if (line.trim() === '') return <br key={index} />;
                          if (index === 0) {
                            return <h2 key={index} className="marketplace-title">{line}</h2>;
                          }
                          // Check if line is a heading (starts with "Waarom", "Wat is", "Samengevat", etc.)
                          const isHeading = line.match(/^(Waarom|Why|Warum|Pourquoi|Wat is|What is|Was ist|Qu'est-ce|Samengevat|In summary|Zusammenfassend|En résumé)/i);
                          if (isHeading) {
                            return <h3 key={index} className="marketplace-subtitle">{line}</h3>;
                          }
                          return <p key={index} className="marketplace-paragraph">{line}</p>;
                        })}
                    </div>
                  </div>
                )}
                {product.id === 3 && (
                  <div className="marketplace-details">
                    <div className="marketplace-content">
                      {getTranslation(currentLanguage, 'cpcDetailed')
                        .split('\n')
                        .map((line, index) => {
                          if (line.trim() === '') return <br key={index} />;
                          if (index === 0) {
                            return <h2 key={index} className="marketplace-title">{line}</h2>;
                          }
                          // Check if line is a heading (starts with "Wat het inhoudt", "Samengevat", etc.)
                          const isHeading = line.match(/^(Wat het inhoudt|What it entails|Was es beinhaltet|Ce que cela implique|Samengevat|In summary|Zusammenfassend|En résumé)/i);
                          if (isHeading) {
                            return <h3 key={index} className="marketplace-subtitle">{line}</h3>;
                          }
                          return <p key={index} className="marketplace-paragraph">{line}</p>;
                        })}
                    </div>
                  </div>
                )}
                {product.id === 5 && (
                  <div className="marketplace-details">
                    <div className="marketplace-content">
                      {getTranslation(currentLanguage, 'magentoDevelopmentDetailed')
                        .split('\n')
                        .map((line, index) => {
                          if (line.trim() === '') return <br key={index} />;
                          if (index === 0) {
                            return <h2 key={index} className="marketplace-title">{line}</h2>;
                          }
                          // Check if line is a heading (starts with "Wat je krijgt", "Voor wie", "Samengevat", etc.)
                          const isHeading = line.match(/^(Wat je krijgt|What you get|Was Sie bekommen|Ce que vous obtenez|Voor wie|For whom|Für wen|Pour qui|Samengevat|In summary|Zusammenfassend|En résumé)/i);
                          if (isHeading) {
                            return <h3 key={index} className="marketplace-subtitle">{line}</h3>;
                          }
                          return <p key={index} className="marketplace-paragraph">{line}</p>;
                        })}
                    </div>
                  </div>
                )}
                {product.id === 6 && (
                  <div className="marketplace-details">
                    <div className="marketplace-content">
                      {getTranslation(currentLanguage, 'ownMagentoStoreDetailed')
                        .split('\n')
                        .map((line, index) => {
                          if (line.trim() === '') return <br key={index} />;
                          if (index === 0) {
                            return <h2 key={index} className="marketplace-title">{line}</h2>;
                          }
                          // Check if line is a heading (starts with "Wat je krijgt", "Kosten", "Samengevat", etc.)
                          const isHeading = line.match(/^(Wat je krijgt|What you get|Was Sie bekommen|Ce que vous obtenez|Kosten|Costs|Coûts|Samengevat|In summary|Zusammenfassend|En résumé)/i);
                          if (isHeading) {
                            return <h3 key={index} className="marketplace-subtitle">{line}</h3>;
                          }
                          return <p key={index} className="marketplace-paragraph">{line}</p>;
                        })}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Products;

