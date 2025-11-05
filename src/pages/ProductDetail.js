import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { getLocalizedUrl } from '../utils/languageUtils';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productSlug } = useParams();
  const { currentLanguage } = useLanguage();

  // Map product slugs to translation keys
  const productMap = {
    'marketplace': {
      translationKey: 'marketplaceDetailed',
      titleKey: 'marketplace',
      icon: '🛒',
      headingPattern: /^(Samengevat|In summary|Zusammenfassend|En résumé|Kortom|In short)/i
    },
    'deal-css': {
      translationKey: 'dealCSSDetailed',
      titleKey: 'dealCSS',
      icon: '🎯',
      headingPattern: /^(Waarom|Why|Warum|Pourquoi|Wat is|What is|Was ist|Qu'est-ce|Samengevat|In summary|Zusammenfassend|En résumé)/i
    },
    'cpc': {
      translationKey: 'cpcDetailed',
      titleKey: 'cpc',
      icon: '💰',
      headingPattern: /^(Wat het inhoudt|What it entails|Was es beinhaltet|Ce que cela implique|Samengevat|In summary|Zusammenfassend|En résumé)/i
    },
    'magento-development': {
      translationKey: 'magentoDevelopmentDetailed',
      titleKey: 'magentoDevelopment',
      icon: '⚙️',
      headingPattern: /^(Wat je krijgt|What you get|Was Sie bekommen|Ce que vous obtenez|Voor wie|For whom|Für wen|Pour qui|Samengevat|In summary|Zusammenfassend|En résumé)/i
    },
    'own-magento-store': {
      translationKey: 'ownMagentoStoreDetailed',
      titleKey: 'ownMagentoStore',
      icon: '🏪',
      headingPattern: /^(Wat je krijgt|What you get|Was Sie bekommen|Ce que vous obtenez|Kosten|Costs|Coûts|Samengevat|In summary|Zusammenfassend|En résumé)/i
    }
  };

  const product = productMap[productSlug];

  if (!product) {
    return (
      <div className="w3-content w3-padding" style={{ maxWidth: '1564px', marginTop: '64px' }}>
        <div className="w3-container w3-padding-16">
          <h1>Product not found</h1>
          <Link to={getLocalizedUrl('/products', currentLanguage)}>Back to products</Link>
        </div>
      </div>
    );
  }

  const detailedText = getTranslation(currentLanguage, product.translationKey);
  const productTitle = getTranslation(currentLanguage, product.titleKey);
  const productsUrl = getLocalizedUrl('/products', currentLanguage);

  return (
    <>
      <SEOHead 
        title={`${productTitle} - SDeal`}
        description={getTranslation(currentLanguage, `${product.titleKey}Desc`)}
        keywords={`SDeal, ${productTitle}`}
      />
      <div className="w3-content w3-padding" style={{ maxWidth: '1564px', marginTop: '64px' }}>
        <div className="w3-container w3-padding-16">
          <Link to={productsUrl} className="back-link">
            ← {getTranslation(currentLanguage, 'products')}
          </Link>
          
          <div className="product-detail-header">
            <div className="product-detail-icon">{product.icon}</div>
            <h1 className="product-detail-title">{productTitle}</h1>
          </div>

          <div className="product-detail-content">
            {detailedText
              .split('\n')
              .map((line, index) => {
                if (line.trim() === '') return <br key={index} />;
                if (index === 0) {
                  return <h2 key={index} className="product-detail-main-title">{line}</h2>;
                }
                // Check if line is a heading
                const isHeading = line.match(product.headingPattern);
                if (isHeading) {
                  return <h3 key={index} className="product-detail-subtitle">{line}</h3>;
                }
                return <p key={index} className="product-detail-paragraph">{line}</p>;
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;

