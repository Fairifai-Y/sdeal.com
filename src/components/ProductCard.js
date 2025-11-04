import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <div className="product-icon">
        {product.icon}
      </div>
      <div className="product-content">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-description">{product.description}</p>
      </div>
    </div>
  );
};

export default ProductCard;

