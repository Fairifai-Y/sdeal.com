import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { getLocalizedUrl } from '../utils/languageUtils';
import './Pricing.css';

const Pricing = () => {
  const { currentLanguage } = useLanguage();
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const calculatePrice = (monthlyPrice) => {
    if (billingPeriod === 'yearly') {
      const yearly = monthlyPrice * 12 * 0.75; // 25% korting
      // Rond af naar beneden op tientallen en eindig op .95
      const roundedDown = Math.ceil(yearly / 10) * 10;
      const finalPrice = roundedDown - 0.05;
      return `€${finalPrice.toFixed(2)}`;
    }
    return `€${monthlyPrice.toFixed(2)}`;
  };

  const packages = [
    {
      id: 'A',
      title: getTranslation(currentLanguage, 'packageSelectA'),
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
      ],
      ctaKey: 'startSellingToday',
      icon: 'check'
    },
    {
      id: 'B',
      title: getTranslation(currentLanguage, 'packageSelectB'),
      subtitle: getTranslation(currentLanguage, 'packageBSubtitle'),
      monthlyPrice: 49.00,
      period: billingPeriod === 'yearly' 
        ? getTranslation(currentLanguage, 'perYear') 
        : getTranslation(currentLanguage, 'perMonth'),
      features: [
        getTranslation(currentLanguage, 'packageBFeature2'),
        getTranslation(currentLanguage, 'packageBFeature3'),
        getTranslation(currentLanguage, 'packageBFeature4'),
        getTranslation(currentLanguage, 'packageBFeature5'),
        getTranslation(currentLanguage, 'packageBFeature6'),
        getTranslation(currentLanguage, 'packageBFeature7')
      ],
      ctaKey: 'scaleSalesToday',
      icon: 'arrow',
      highlighted: true,
      mostPopular: true
    },
    {
      id: 'C',
      title: getTranslation(currentLanguage, 'packageSelectC'),
      subtitle: getTranslation(currentLanguage, 'packageCSubtitle'),
      monthlyPrice: 99.00,
      period: billingPeriod === 'yearly' 
        ? getTranslation(currentLanguage, 'perYear') 
        : getTranslation(currentLanguage, 'perMonth'),
      features: [
        getTranslation(currentLanguage, 'packageCFeature2'),
        getTranslation(currentLanguage, 'packageCFeature3'),
        getTranslation(currentLanguage, 'packageCFeature4'),
        getTranslation(currentLanguage, 'packageCFeature5'),
        getTranslation(currentLanguage, 'packageCFeature6'),
        getTranslation(currentLanguage, 'packageCFeature7')
      ],
      ctaKey: 'maximizeRevenueToday',
      icon: 'arrow',
      fullPackage: true
    }
  ];

  const calculateAddOnPrice = (monthlyPrice) => {
    if (!monthlyPrice) return '';
    if (billingPeriod === 'yearly') {
      const yearly = monthlyPrice * 12 * 0.75; // 25% korting
      // Rond af naar boven op tientallen en eindig op .95
      const roundedUp = Math.ceil(yearly / 10) * 10;
      const finalPrice = roundedUp - 0.05;
      return `€${finalPrice.toFixed(2)} ${getTranslation(currentLanguage, 'perYear')}`;
    }
    return `€${monthlyPrice.toFixed(2)} ${getTranslation(currentLanguage, 'perMonth')}`;
  };

  // Map add-on names to product slugs
  const getAddOnSlug = (addonName) => {
    const addonSlugMap = {
      [getTranslation(currentLanguage, 'addonDEALCSS')]: 'deal-css',
      [getTranslation(currentLanguage, 'addonCPC')]: 'cpc',
      [getTranslation(currentLanguage, 'addonMagentoDevelopment')]: 'magento-development',
      [getTranslation(currentLanguage, 'addonOwnMagentoStore')]: 'own-magento-store'
    };
    return addonSlugMap[addonName] || null;
  };

  const addOns = [
    {
      name: getTranslation(currentLanguage, 'addonDEALCSS'),
      monthlyPrice: 24.95,
      description: getTranslation(currentLanguage, 'addonDEALCSSDescription'),
      linkToContact: false
    },
    {
      name: getTranslation(currentLanguage, 'addonCPC'),
      monthlyPrice: 39.95,
      description: getTranslation(currentLanguage, 'addonCPCDescription'),
      linkToContact: false
    },
    {
      name: getTranslation(currentLanguage, 'addonMagentoDevelopment'),
      monthlyPrice: null,
      customPrice: getTranslation(currentLanguage, 'addonMagentoDevelopmentPrice'),
      description: getTranslation(currentLanguage, 'addonMagentoDevelopmentDescription'),
      linkToContact: true
    },
    {
      name: getTranslation(currentLanguage, 'addonOwnMagentoStore'),
      monthlyPrice: null,
      customPrice: getTranslation(currentLanguage, 'addonOwnMagentoStorePrice'),
      description: getTranslation(currentLanguage, 'addonOwnMagentoStoreDescription'),
      linkToContact: true
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
              <span className="discount-badge">{getTranslation(currentLanguage, 'yearlySave')}</span>
            </button>
          </div>
        </div>

        <div className="pricing-container">
          <div className="pricing-packages">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`pricing-card ${pkg.highlighted ? 'highlighted' : ''}`}>
                <div className="package-icon">
                  {pkg.icon === 'check' && <span className="icon-check">✓</span>}
                  {pkg.icon === 'arrow' && <span className="icon-arrow">→</span>}
                </div>
                {pkg.mostPopular && (
                  <span className="package-most-popular">{getTranslation(currentLanguage, 'packageBMostPopular')}</span>
                )}
                {pkg.fullPackage && (
                  <span className="package-full-package">{getTranslation(currentLanguage, 'packageCFullPackage')}</span>
                )}
                <h3 className="package-title">{pkg.title}</h3>
                <p className="package-subtitle">{pkg.subtitle}</p>
                <div className="package-price">
                  <p className="package-price-line">
                    {getTranslation(currentLanguage, 'noSetupCosts')}, {calculatePrice(pkg.monthlyPrice)} / {pkg.period}
                  </p>
                </div>
                <ul className="package-features">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-check">✓</span>
                      <span className="feature-text">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to={getLocalizedUrl(`/package?newCustomer=true&package=${pkg.id}`, currentLanguage)}
                  className="package-start-selling-btn"
                >
                  👉 {getTranslation(currentLanguage, pkg.ctaKey)}
                </Link>
              </div>
            ))}
          </div>

          <div className="addons-section">
            <h2 className="addons-title">{getTranslation(currentLanguage, 'addonsTitle')}</h2>
            <div className="addons-grid">
              {addOns.map((addon, index) => {
                const productSlug = getAddOnSlug(addon.name);
                const productUrl = productSlug ? getLocalizedUrl(`/products/${productSlug}`, currentLanguage) : null;
                
                const cardContent = (
                  <>
                    <h4 className="addon-name">{addon.name}</h4>
                    <div className="addon-price-container">
                      <span className="addon-price">
                        {addon.customPrice ? addon.customPrice : calculateAddOnPrice(addon.monthlyPrice)}
                      </span>
                    </div>
                    {addon.description && (
                      <p className="addon-description">{addon.description}</p>
                    )}
                    {productUrl && (
                      <Link to={productUrl} className="addon-more-info-btn">
                        {getTranslation(currentLanguage, 'moreInfo')}
                      </Link>
                    )}
                  </>
                );

                if (addon.linkToContact) {
                  return (
                    <div key={index} className="addon-card">
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <div key={index} className="addon-card">
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
