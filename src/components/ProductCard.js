import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedUrl } from '../utils/languageUtils';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { currentLanguage } = useLanguage();

  // Map product IDs to slugs
  const productSlugs = {
    1: 'marketplace',
    2: 'deal-css',
    3: 'cpc',
    4: null, // Review FairifAI has no detailed page yet
    5: 'magento-development',
    6: 'own-magento-store'
  };

  const productSlug = productSlugs[product.id];
  const detailUrl = productSlug ? getLocalizedUrl(`/products/${productSlug}`, currentLanguage) : null;

  const cardContent = (
    <>
      <div className="product-icon">
        {product.icon}
      </div>
      <div className="product-content">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-description">{product.description}</p>
      </div>
    </>
  );

  if (detailUrl) {
    return (
      <Link to={detailUrl} className="product-card product-card-link">
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="product-card">
      {cardContent}
    </div>
  );
};

export default ProductCard;

