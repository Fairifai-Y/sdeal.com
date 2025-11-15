import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { getLocalizedUrl } from '../utils/languageUtils';
import SEOHead from '../components/SEOHead';
import './Package.css';

const Package = () => {
  const { currentLanguage } = useLanguage();
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedAddons, setSelectedAddons] = useState({
    dealCSS: false,
    caas: false,
    fairifAI: false
  });
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle package selection
  const handlePackageChange = (packageType) => {
    setSelectedPackage(packageType);
    setErrors({ ...errors, package: '' });
  };

  // Handle addon selection
  const handleAddonChange = (addon) => {
    setSelectedAddons({
      ...selectedAddons,
      [addon]: !selectedAddons[addon]
    });
  };

  // Handle agreement checkbox
  const handleAgreementChange = () => {
    setAgreementAccepted(!agreementAccepted);
    setErrors({ ...errors, agreement: '' });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedPackage) {
      newErrors.package = 'Please select a package';
    }
    
    if (!agreementAccepted) {
      newErrors.agreement = 'You must accept the agreement to continue';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Submit to API
    try {
      const response = await fetch('/api/package/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package: selectedPackage,
          addons: selectedAddons,
          agreementAccepted: agreementAccepted,
          language: currentLanguage,
          // Optional: Add sellerEmail and sellerId if available
          // sellerEmail: 'seller@example.com',
          // sellerId: 'seller-123'
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmitSuccess(true);
        // Success message is shown in the UI
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting package selection:', error);
      setErrors({ 
        ...errors, 
        submit: error.message || 'Failed to submit package selection. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (submitSuccess) {
    return (
      <div className="package-container">
        <SEOHead 
          title={`${getTranslation(currentLanguage, 'packageHeroTitle')} - SDeal`}
          description={getTranslation(currentLanguage, 'packageHeroSubtitle')}
        />
        <div className="package-success">
          <div className="success-icon">✓</div>
          <h1>{getTranslation(currentLanguage, 'packageCTANote')}</h1>
          <p>Your package selection has been confirmed. You will receive a confirmation email shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="package-container">
      <SEOHead 
        title={`${getTranslation(currentLanguage, 'packageHeroTitle')} - SDeal`}
        description={getTranslation(currentLanguage, 'packageHeroSubtitle')}
      />
      
      {/* Hero Section */}
      <section className="package-hero">
        <div className="package-content">
          <h1>{getTranslation(currentLanguage, 'packageHeroTitle')}</h1>
          <p className="package-subtitle">{getTranslation(currentLanguage, 'packageHeroSubtitle')}</p>
        </div>
      </section>

      {/* Why Section */}
      <section className="package-why-section">
        <div className="package-content">
          <div className="package-why-card">
            <h2>{getTranslation(currentLanguage, 'packageWhyTitle')}</h2>
            <div className="package-why-text">
              {getTranslation(currentLanguage, 'packageWhyText')
                .split('\n\n')
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Package Selection Form */}
      <form onSubmit={handleSubmit} className="package-form">
        <div className="package-content">
          {/* Package Selection */}
          <section className="package-selection">
            <h2>{getTranslation(currentLanguage, 'packageChooseTitle')}</h2>
            <div className="package-cards">
              {/* Package A */}
              <div className={`package-card ${selectedPackage === 'A' ? 'selected' : ''}`}>
                <label>
                  <input
                    type="radio"
                    name="package"
                    value="A"
                    checked={selectedPackage === 'A'}
                    onChange={() => handlePackageChange('A')}
                  />
                  <div className="package-card-content">
                    <h3>{getTranslation(currentLanguage, 'packageSelectA')}</h3>
                    <p className="package-price">{getTranslation(currentLanguage, 'packageAPrice')}</p>
                    <ul>
                      <li>{getTranslation(currentLanguage, 'packageADesc1')}</li>
                      <li>{getTranslation(currentLanguage, 'packageADesc2')}</li>
                      <li>{getTranslation(currentLanguage, 'packageADesc3')}</li>
                      <li>{getTranslation(currentLanguage, 'packageADesc4')}</li>
                    </ul>
                  </div>
                </label>
              </div>

              {/* Package B */}
              <div className={`package-card ${selectedPackage === 'B' ? 'selected' : ''}`}>
                <label>
                  <input
                    type="radio"
                    name="package"
                    value="B"
                    checked={selectedPackage === 'B'}
                    onChange={() => handlePackageChange('B')}
                  />
                  <div className="package-card-content">
                    <h3>{getTranslation(currentLanguage, 'packageSelectB')}</h3>
                    <p className="package-price">{getTranslation(currentLanguage, 'packageBPrice')}</p>
                    <ul>
                      <li>{getTranslation(currentLanguage, 'packageBDesc1')}</li>
                      <li>{getTranslation(currentLanguage, 'packageBDesc2')}</li>
                      <li>{getTranslation(currentLanguage, 'packageBDesc3')}</li>
                      <li>{getTranslation(currentLanguage, 'packageBDesc4')}</li>
                    </ul>
                  </div>
                </label>
              </div>

              {/* Package C */}
              <div className={`package-card ${selectedPackage === 'C' ? 'selected' : ''}`}>
                <label>
                  <input
                    type="radio"
                    name="package"
                    value="C"
                    checked={selectedPackage === 'C'}
                    onChange={() => handlePackageChange('C')}
                  />
                  <div className="package-card-content">
                    <h3>{getTranslation(currentLanguage, 'packageSelectC')}</h3>
                    <p className="package-price">{getTranslation(currentLanguage, 'packageCPrice')}</p>
                    <ul>
                      <li>{getTranslation(currentLanguage, 'packageCDesc1')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCDesc2')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCDesc3')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCDesc4')}</li>
                    </ul>
                  </div>
                </label>
              </div>
            </div>
            {errors.package && <div className="error-message">{errors.package}</div>}
            <p className="package-change-note">{getTranslation(currentLanguage, 'packageChangeNote')}</p>
          </section>

          {/* Add-ons Section */}
          <section className="package-addons">
            <h2>{getTranslation(currentLanguage, 'packageAddonsTitle')}</h2>
            <div className="addons-list">
              <label className="addon-item">
                <input
                  type="checkbox"
                  checked={selectedAddons.dealCSS}
                  onChange={() => handleAddonChange('dealCSS')}
                />
                <span>{getTranslation(currentLanguage, 'packageAddonDEALCSS')}</span>
              </label>
              <label className="addon-item">
                <input
                  type="checkbox"
                  checked={selectedAddons.caas}
                  onChange={() => handleAddonChange('caas')}
                />
                <span>{getTranslation(currentLanguage, 'packageAddonCAAS')}</span>
              </label>
              <label className="addon-item">
                <input
                  type="checkbox"
                  checked={selectedAddons.fairifAI}
                  onChange={() => handleAddonChange('fairifAI')}
                />
                <span>{getTranslation(currentLanguage, 'packageAddonFairifAI')}</span>
              </label>
            </div>
          </section>

          {/* Agreement Section */}
          <section className="package-agreement">
            <h2>{getTranslation(currentLanguage, 'packageConfirmTitle')}</h2>
            <p>{getTranslation(currentLanguage, 'packageConfirmText')}</p>
            <div className="agreement-links">
              <a href="/images/SDeal Agreement.pdf" target="_blank" rel="noopener noreferrer">
                📄 {getTranslation(currentLanguage, 'packageAgreementLink')}
              </a>
              <a href={getLocalizedUrl('/terms-sellers', currentLanguage)} target="_blank" rel="noopener noreferrer">
                📄 {getTranslation(currentLanguage, 'packageTermsLink')}
              </a>
            </div>
            <label className="agreement-checkbox">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={handleAgreementChange}
              />
              <span>{getTranslation(currentLanguage, 'packageAgreementCheckbox')}</span>
            </label>
            {errors.agreement && <div className="error-message">{errors.agreement}</div>}
            <p className="legal-note">{getTranslation(currentLanguage, 'packageLegalNote1')}</p>
            <p className="legal-note-small">{getTranslation(currentLanguage, 'packageLegalNote2')}</p>
          </section>

          {/* CTA Button */}
          <section className="package-cta">
            {errors.submit && <div className="error-message">{errors.submit}</div>}
            <button 
              type="submit" 
              className="cta-button"
              disabled={isSubmitting || !selectedPackage || !agreementAccepted}
            >
              {isSubmitting ? 'Processing...' : getTranslation(currentLanguage, 'packageCTAButton')}
            </button>
            <p className="cta-note">{getTranslation(currentLanguage, 'packageCTANote')}</p>
          </section>
        </div>
      </form>

      {/* FAQ Section */}
      <section className="package-faq">
        <div className="package-content">
          <h2>{getTranslation(currentLanguage, 'packageFAQTitle')}</h2>
          <div className="faq-item">
            <h3>{getTranslation(currentLanguage, 'packageFAQ1Question')}</h3>
            <p>{getTranslation(currentLanguage, 'packageFAQ1Answer')}</p>
          </div>
          <div className="faq-item">
            <h3>{getTranslation(currentLanguage, 'packageFAQ2Question')}</h3>
            <p>{getTranslation(currentLanguage, 'packageFAQ2Answer')}</p>
          </div>
          <div className="faq-item">
            <h3>{getTranslation(currentLanguage, 'packageFAQ3Question')}</h3>
            <p>{getTranslation(currentLanguage, 'packageFAQ3Answer')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Package;

