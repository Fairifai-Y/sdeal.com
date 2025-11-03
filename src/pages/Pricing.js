import React, { useState } from 'react';
import SEOHead from '../components/SEOHead';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Pricing.css';

const Pricing = () => {
  const { currentLanguage } = useLanguage();
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const calculatePrice = (monthlyPrice) => {
    if (billingPeriod === 'yearly') {
      const yearly = monthlyPrice * 12 * 0.75; // 25% korting
      return `€${yearly.toFixed(2)}`;
    }
    return `€${monthlyPrice.toFixed(2)}`;
  };

  const packages = [
    {
      id: 'A',
      title: getTranslation(currentLanguage, 'packageA'),
      subtitle: getTranslation(currentLanguage, 'packageASubtitle'),
      monthlyPrice: 29.00,
      period: billingPeriod === 'yearly' 
        ? getTranslation(currentLanguage, 'perYear') 
        : getTranslation(currentLanguage, 'perMonth'),
      features: [
        getTranslation(currentLanguage, 'packageAFeature2'),
        getTranslation(currentLanguage, 'packageAFeature3'),
        getTranslation(currentLanguage, 'packageAFeature4'),
        getTranslation(currentLanguage, 'packageAFeature5')
      ]
    },
    {
      id: 'B',
      title: getTranslation(currentLanguage, 'packageB'),
      subtitle: getTranslation(currentLanguage, 'packageBSubtitle'),
      monthlyPrice: 49.00,
      period: billingPeriod === 'yearly' 
        ? getTranslation(currentLanguage, 'perYear') 
        : getTranslation(currentLanguage, 'perMonth'),
      features: [
        getTranslation(currentLanguage, 'packageBFeature2'),
        getTranslation(currentLanguage, 'packageBFeature4'),
        getTranslation(currentLanguage, 'packageBFeature5')
      ]
    },
    {
      id: 'C',
      title: getTranslation(currentLanguage, 'packageC'),
      subtitle: getTranslation(currentLanguage, 'packageCSubtitle'),
      monthlyPrice: 99.00,
      period: billingPeriod === 'yearly' 
        ? getTranslation(currentLanguage, 'perYear') 
        : getTranslation(currentLanguage, 'perMonth'),
      features: [
        getTranslation(currentLanguage, 'packageCFeature2'),
        getTranslation(currentLanguage, 'packageCFeature3'),
        getTranslation(currentLanguage, 'packageCFeature5'),
        getTranslation(currentLanguage, 'packageCFeature6'),
        getTranslation(currentLanguage, 'packageCFeature7'),
        getTranslation(currentLanguage, 'packageCFeature8')
      ],
      highlighted: true
    }
  ];

  const addOns = [
    {
      name: getTranslation(currentLanguage, 'addonFairifAI'),
      price: getTranslation(currentLanguage, 'addonFairifAIPrice')
    },
    {
      name: getTranslation(currentLanguage, 'addonDEALCSS'),
      price: getTranslation(currentLanguage, 'addonDEALCSSPrice'),
      description: getTranslation(currentLanguage, 'addonDEALCSSDescription')
    },
    {
      name: getTranslation(currentLanguage, 'addonCPC'),
      price: getTranslation(currentLanguage, 'addonCPCPrice')
    }
  ];

  return (
    <>
      <SEOHead 
        title={`${getTranslation(currentLanguage, 'pricingTitle')} - SDeal`}
        description={getTranslation(currentLanguage, 'pricingDescription')}
        keywords="SDeal, pricing, seller packages, marketplace"
      />
      <div className="pricing-page">
        <div className="pricing-hero">
          <h1 className="pricing-title">{getTranslation(currentLanguage, 'pricingTitle')}</h1>
          <p className="pricing-subtitle">{getTranslation(currentLanguage, 'pricingSubtitle')}</p>
          
          <div className="billing-period-selector">
            <span className="billing-label">{getTranslation(currentLanguage, 'billingPeriod')}:</span>
            <button 
              className={`billing-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              {getTranslation(currentLanguage, 'monthly')}
            </button>
            <button 
              className={`billing-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              {getTranslation(currentLanguage, 'yearly')}
              <span className="discount-badge">-25%</span>
            </button>
          </div>
        </div>

        <div className="pricing-container">
          <div className="pricing-packages">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`pricing-card ${pkg.highlighted ? 'highlighted' : ''}`}>
                <div className="package-icon">
                  {pkg.id === 'A' && <span className="icon-check">✓</span>}
                  {pkg.id === 'B' && <span className="icon-arrow">→</span>}
                  {pkg.id === 'C' && <span className="icon-star">★</span>}
                </div>
                <h3 className="package-title">{pkg.title}</h3>
                <p className="package-subtitle">{pkg.subtitle}</p>
                <div className="package-price">
                  <span className="price-amount">{calculatePrice(pkg.monthlyPrice)}</span>
                  <span className="price-period"> {pkg.period}</span>
                </div>
                <ul className="package-features">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-check">✓</span>
                      <span className="feature-text">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="addons-section">
            <h2 className="addons-title">{getTranslation(currentLanguage, 'addonsTitle')}</h2>
            <div className="addons-grid">
              {addOns.map((addon, index) => (
                <div key={index} className="addon-card">
                  <h4 className="addon-name">{addon.name}</h4>
                  <p className="addon-price">{addon.price}</p>
                  {addon.description && (
                    <p className="addon-description">{addon.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
