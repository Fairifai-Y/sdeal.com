import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { getLocalizedUrl } from '../utils/languageUtils';
import { useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import './Package.css';

const Package = () => {
  const { currentLanguage } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get sellerId from URL parameter
  const urlSellerId = searchParams.get('sellerId');
  
  const [showSellerInfo, setShowSellerInfo] = useState(!urlSellerId);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedAddons, setSelectedAddons] = useState({
    dealCSS: false,
    caas: false
  });
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [sellerId, setSellerId] = useState(urlSellerId || '');
  const [sellerEmail, setSellerEmail] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Update sellerId when URL parameter changes
  useEffect(() => {
    if (urlSellerId) {
      setSellerId(urlSellerId);
      setShowSellerInfo(false);
      // Note: sellerEmail still needs to be filled in the form below
    }
  }, [urlSellerId]);

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

  // Handle billing period change
  const handleBillingPeriodChange = (period) => {
    setBillingPeriod(period);
  };

  // Handle agreement checkbox
  const handleAgreementChange = () => {
    setAgreementAccepted(!agreementAccepted);
    setErrors({ ...errors, agreement: '' });
  };

  // Handle seller info submission (first step)
  const handleSellerInfoSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!sellerEmail || sellerEmail.trim() === '') {
      newErrors.sellerEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
      newErrors.sellerEmail = 'Please enter a valid email address';
    }
    
    if (!sellerId || sellerId.trim() === '') {
      newErrors.sellerId = 'Seller ID is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setShowSellerInfo(false);
      // Update URL with sellerId
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('sellerId', sellerId.trim());
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedPackage) {
      newErrors.package = currentLanguage === 'nl' 
        ? 'Selecteer een pakket' 
        : currentLanguage === 'de'
        ? 'Wählen Sie ein Paket'
        : currentLanguage === 'fr'
        ? 'Sélectionnez un forfait'
        : 'Please select a package';
    }
    
    if (!sellerId || sellerId.trim() === '') {
      newErrors.sellerId = 'Seller ID is required';
    }
    
    if (!sellerEmail || sellerEmail.trim() === '') {
      newErrors.sellerEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
      newErrors.sellerEmail = 'Please enter a valid email address';
    }
    
    // Validate commission percentage based on package
    if (selectedPackage === 'A') {
      // Pakket A vereist commissie (minimaal 12%)
      if (!commissionPercentage || isNaN(parseFloat(commissionPercentage))) {
        newErrors.commissionPercentage = currentLanguage === 'nl'
          ? 'Commissie percentage is verplicht voor Pakket A'
          : currentLanguage === 'de'
          ? 'Provisionsprozentsatz ist für Paket A erforderlich'
          : currentLanguage === 'fr'
          ? 'Le pourcentage de commission est requis pour le forfait A'
          : 'Commission percentage is required for Package A';
      } else {
        const commission = parseFloat(commissionPercentage);
        if (commission < 12) {
          newErrors.commissionPercentage = currentLanguage === 'nl'
            ? 'Commissie moet minimaal 12% zijn voor Pakket A'
            : currentLanguage === 'de'
            ? 'Provision muss mindestens 12% für Paket A betragen'
            : currentLanguage === 'fr'
            ? 'La commission doit être d\'au moins 12% pour le forfait A'
            : 'Commission must be at least 12% for Package A';
        }
      }
    } else if (selectedPackage === 'B' || selectedPackage === 'C') {
      const commission = parseFloat(commissionPercentage);
      if (!commissionPercentage || isNaN(commission) || commission < 4) {
        if (currentLanguage === 'nl') {
          newErrors.commissionPercentage = selectedPackage === 'B'
            ? 'Commissie moet minimaal 4% zijn voor Pakket B'
            : 'Commissie moet minimaal 4% zijn voor Pakket C';
        } else if (currentLanguage === 'de') {
          newErrors.commissionPercentage = selectedPackage === 'B'
            ? 'Provision muss mindestens 4% für Paket B betragen'
            : 'Provision muss mindestens 4% für Paket C betragen';
        } else if (currentLanguage === 'fr') {
          newErrors.commissionPercentage = selectedPackage === 'B'
            ? 'La commission doit être d\'au moins 4% pour le forfait B'
            : 'La commission doit être d\'au moins 4% pour le forfait C';
        } else {
          newErrors.commissionPercentage = selectedPackage === 'B'
            ? 'Commission must be at least 4% for Package B'
            : 'Commission must be at least 4% for Package C';
        }
      }
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
          sellerId: sellerId.trim(),
          sellerEmail: sellerEmail.trim(),
          startDate: startDate,
          commissionPercentage: commissionPercentage ? parseFloat(commissionPercentage) : null,
          billingPeriod: billingPeriod
        })
      });
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (result.success) {
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

  // Show seller info form if sellerId is not in URL
  if (showSellerInfo) {
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

        {/* Seller Information Step */}
        <section className="package-seller-info-step">
          <div className="package-content">
            <div className="seller-info-card">
              <h2>{getTranslation(currentLanguage, 'sellerInfoTitle')}</h2>
              <p className="seller-info-description">{getTranslation(currentLanguage, 'sellerInfoDescription')}</p>
              <form onSubmit={handleSellerInfoSubmit} className="seller-info-form">
                <div className="form-group">
                  <label htmlFor="sellerEmail">{getTranslation(currentLanguage, 'sellerEmailLabel')}</label>
                  <input
                    id="sellerEmail"
                    type="email"
                    className={`form-input ${errors.sellerEmail ? 'error' : ''}`}
                    placeholder={getTranslation(currentLanguage, 'sellerEmailPlaceholder')}
                    value={sellerEmail}
                    onChange={(e) => {
                      setSellerEmail(e.target.value);
                      setErrors({ ...errors, sellerEmail: '' });
                    }}
                    required
                  />
                  {errors.sellerEmail && <div className="error-message">{errors.sellerEmail}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="sellerId">{getTranslation(currentLanguage, 'sellerIdLabel')}</label>
                  <input
                    id="sellerId"
                    type="text"
                    className={`form-input ${errors.sellerId ? 'error' : ''}`}
                    placeholder={getTranslation(currentLanguage, 'sellerIdPlaceholder')}
                    value={sellerId}
                    onChange={(e) => {
                      setSellerId(e.target.value);
                      setErrors({ ...errors, sellerId: '' });
                    }}
                    required
                  />
                  {errors.sellerId && <div className="error-message">{errors.sellerId}</div>}
                </div>
                <button type="submit" className="seller-info-submit-btn">
                  {getTranslation(currentLanguage, 'choosePackage')}
                </button>
              </form>
            </div>
          </div>
        </section>
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
                    <h3>{getTranslation(currentLanguage, 'packageA')}</h3>
                    <p className="package-subtitle-small">{getTranslation(currentLanguage, 'packageASubtitle')}</p>
                    <p className="package-price">{getTranslation(currentLanguage, 'packageAFeature1')}</p>
                    <ul>
                      <li>{getTranslation(currentLanguage, 'packageAFeature2')}</li>
                      <li>{getTranslation(currentLanguage, 'packageAFeature3')}</li>
                      <li>{getTranslation(currentLanguage, 'packageAFeature4')}</li>
                      <li>{getTranslation(currentLanguage, 'packageAFeature5')}</li>
                    </ul>
                    <button
                      type="button"
                      className={`package-choose-btn ${selectedPackage === 'A' ? 'selected' : ''}`}
                      onClick={() => handlePackageChange('A')}
                    >
                      {getTranslation(currentLanguage, 'choosePackage')}
                    </button>
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
                    <h3>{getTranslation(currentLanguage, 'packageB')}</h3>
                    <p className="package-subtitle-small">{getTranslation(currentLanguage, 'packageBSubtitle')}</p>
                    <p className="package-price">{getTranslation(currentLanguage, 'packageBFeature1')}</p>
                    <ul>
                      <li>{getTranslation(currentLanguage, 'packageBFeature2')}</li>
                      <li>{getTranslation(currentLanguage, 'packageBFeature3')}</li>
                      <li>{getTranslation(currentLanguage, 'packageBFeature4')}</li>
                      <li>{getTranslation(currentLanguage, 'packageBFeature5')}</li>
                      <li>{getTranslation(currentLanguage, 'packageBFeature6')}</li>
                    </ul>
                    <button
                      type="button"
                      className={`package-choose-btn ${selectedPackage === 'B' ? 'selected' : ''}`}
                      onClick={() => handlePackageChange('B')}
                    >
                      {getTranslation(currentLanguage, 'choosePackage')}
                    </button>
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
                    <h3>{getTranslation(currentLanguage, 'packageC')}</h3>
                    <p className="package-subtitle-small">{getTranslation(currentLanguage, 'packageCSubtitle')}</p>
                    <p className="package-price">{getTranslation(currentLanguage, 'packageCFeature1')}</p>
                    <ul>
                      <li>{getTranslation(currentLanguage, 'packageCFeature2')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCFeature3')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCFeature4')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCFeature5')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCFeature6')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCFeature7')}</li>
                      <li>{getTranslation(currentLanguage, 'packageCFeature8')}</li>
                    </ul>
                    <button
                      type="button"
                      className={`package-choose-btn ${selectedPackage === 'C' ? 'selected' : ''}`}
                      onClick={() => handlePackageChange('C')}
                    >
                      {getTranslation(currentLanguage, 'choosePackage')}
                    </button>
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
            </div>
          </section>

          {/* Seller Information Section - Email */}
          <section className="package-seller-info">
            <h2>{getTranslation(currentLanguage, 'sellerEmailLabel')}</h2>
            <div className="form-group">
              <input
                type="email"
                className={`form-input ${errors.sellerEmail ? 'error' : ''}`}
                placeholder={getTranslation(currentLanguage, 'sellerEmailPlaceholder')}
                value={sellerEmail}
                onChange={(e) => {
                  setSellerEmail(e.target.value);
                  setErrors({ ...errors, sellerEmail: '' });
                }}
                required
              />
              {errors.sellerEmail && <div className="error-message">{errors.sellerEmail}</div>}
            </div>
          </section>
          
          {/* Seller ID Display - Read-only if from URL */}
          <section className="package-seller-info">
            <h2>{getTranslation(currentLanguage, 'sellerIdLabel')}</h2>
            <div className="form-group">
              <input
                type="text"
                className={`form-input ${errors.sellerId ? 'error' : ''} ${urlSellerId ? 'read-only' : ''}`}
                placeholder={getTranslation(currentLanguage, 'sellerIdPlaceholder')}
                value={sellerId}
                onChange={(e) => {
                  setSellerId(e.target.value);
                  setErrors({ ...errors, sellerId: '' });
                }}
                readOnly={!!urlSellerId}
                required
              />
              {errors.sellerId && <div className="error-message">{errors.sellerId}</div>}
            </div>
          </section>

          {/* Start Date Section */}
          <section className="package-start-date">
            <h2>{getTranslation(currentLanguage, 'startDateTitle')}</h2>
            <div className="start-date-options">
              <label className={`start-date-option ${startDate === 'immediate' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="startDate"
                  value="immediate"
                  checked={startDate === 'immediate'}
                  onChange={() => setStartDate('immediate')}
                />
                <span>{getTranslation(currentLanguage, 'startDateImmediate')}</span>
              </label>
              <label className={`start-date-option ${startDate === '2026-01-01' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="startDate"
                  value="2026-01-01"
                  checked={startDate === '2026-01-01'}
                  onChange={() => setStartDate('2026-01-01')}
                />
                <span>{getTranslation(currentLanguage, 'startDate2026')}</span>
              </label>
            </div>
          </section>

          {/* Commission Percentage Section */}
          {selectedPackage && (
            <section className="package-commission">
              <h2>{getTranslation(currentLanguage, 'commissionPercentageLabel')}</h2>
              <div className="form-group">
                <input
                  type="number"
                  step="0.1"
                  min={selectedPackage === 'A' ? 12 : 4}
                  max={100}
                  className={`form-input ${errors.commissionPercentage ? 'error' : ''}`}
                  placeholder={getTranslation(currentLanguage, 'commissionPercentagePlaceholder')}
                  value={commissionPercentage}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow typing, but validate on blur and submit
                    setCommissionPercentage(value);
                    // Clear error when user starts typing
                    if (errors.commissionPercentage) {
                      setErrors({ ...errors, commissionPercentage: '' });
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    const minValue = selectedPackage === 'A' ? 12 : 4;
                    
                    if (value && value.trim() !== '') {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        if (numValue < minValue) {
                          // Auto-correct to minimum value
                          setCommissionPercentage(minValue.toString());
                          const newErrors = { ...errors };
                          if (currentLanguage === 'nl') {
                            newErrors.commissionPercentage = selectedPackage === 'A'
                              ? 'Commissie moet minimaal 12% zijn voor Pakket A'
                              : `Commissie moet minimaal 4% zijn voor Pakket ${selectedPackage}`;
                          } else if (currentLanguage === 'de') {
                            newErrors.commissionPercentage = selectedPackage === 'A'
                              ? 'Provision muss mindestens 12% für Paket A betragen'
                              : `Provision muss mindestens 4% für Paket ${selectedPackage} betragen`;
                          } else if (currentLanguage === 'fr') {
                            newErrors.commissionPercentage = selectedPackage === 'A'
                              ? 'La commission doit être d\'au moins 12% pour le forfait A'
                              : `La commission doit être d'au moins 4% pour le forfait ${selectedPackage}`;
                          } else {
                            newErrors.commissionPercentage = selectedPackage === 'A'
                              ? 'Commission must be at least 12% for Package A'
                              : `Commission must be at least 4% for Package ${selectedPackage}`;
                          }
                          setErrors(newErrors);
                        } else if (numValue > 100) {
                          setCommissionPercentage('100');
                          setErrors({ ...errors, commissionPercentage: '' });
                        } else {
                          setErrors({ ...errors, commissionPercentage: '' });
                        }
                      }
                    }
                  }}
                  required
                />
                <p className="form-hint">
                  {selectedPackage === 'A' 
                    ? getTranslation(currentLanguage, 'commissionPercentageMinA')
                    : getTranslation(currentLanguage, 'commissionPercentageMinBC')
                  }
                </p>
                {errors.commissionPercentage && <div className="error-message">{errors.commissionPercentage}</div>}
              </div>
            </section>
          )}

          {/* Payment Section */}
          <section className="package-payment">
            <h2>{getTranslation(currentLanguage, 'paymentTitle')}</h2>
            <div className="payment-options">
              <label className={`payment-option ${billingPeriod === 'monthly' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="billingPeriod"
                  value="monthly"
                  checked={billingPeriod === 'monthly'}
                  onChange={() => handleBillingPeriodChange('monthly')}
                />
                <div className="payment-option-content">
                  <span className="payment-option-label">{getTranslation(currentLanguage, 'monthly')}</span>
                </div>
              </label>
              <label className={`payment-option ${billingPeriod === 'yearly' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="billingPeriod"
                  value="yearly"
                  checked={billingPeriod === 'yearly'}
                  onChange={() => handleBillingPeriodChange('yearly')}
                />
                <div className="payment-option-content">
                  <span className="payment-option-label">{getTranslation(currentLanguage, 'yearly')}</span>
                  <span className="payment-discount">{getTranslation(currentLanguage, 'yearlyDiscount')}</span>
                </div>
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

          {/* Package Summary Section - Show before confirmation */}
          {selectedPackage && (
            <section className="package-summary">
              <h2>{getTranslation(currentLanguage, 'packageSummaryTitle')}</h2>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">{getTranslation(currentLanguage, 'packageSummaryPackage')}:</span>
                  <span className="summary-value">{getTranslation(currentLanguage, `packageSelect${selectedPackage}`)}</span>
                </div>
                {sellerId && (
                  <div className="summary-item">
                    <span className="summary-label">{getTranslation(currentLanguage, 'packageSummarySellerId')}:</span>
                    <span className="summary-value">{sellerId}</span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">{getTranslation(currentLanguage, 'packageSummaryStartDate')}:</span>
                  <span className="summary-value">
                    {startDate === 'immediate' 
                      ? getTranslation(currentLanguage, 'startDateImmediate')
                      : getTranslation(currentLanguage, 'startDate2026')
                    }
                  </span>
                </div>
                {selectedPackage && (
                  <div className="summary-item">
                    <span className="summary-label">{getTranslation(currentLanguage, 'packageSummaryCommission')}:</span>
                    <span className="summary-value">
                      {commissionPercentage ? `${commissionPercentage}%` : '-'}
                    </span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">{getTranslation(currentLanguage, 'packageSummaryBilling')}:</span>
                  <span className="summary-value">
                    {billingPeriod === 'monthly' 
                      ? getTranslation(currentLanguage, 'monthly')
                      : getTranslation(currentLanguage, 'yearly')
                    }
                    {billingPeriod === 'yearly' && (
                      <span className="summary-discount"> ({getTranslation(currentLanguage, 'yearlyDiscount')})</span>
                    )}
                  </span>
                </div>
                {(selectedAddons.dealCSS || selectedAddons.caas) && (
                  <div className="summary-item">
                    <span className="summary-label">{getTranslation(currentLanguage, 'packageAddonsTitle')}:</span>
                    <span className="summary-value">
                      {[
                        selectedAddons.dealCSS && getTranslation(currentLanguage, 'packageAddonDEALCSS'),
                        selectedAddons.caas && getTranslation(currentLanguage, 'packageAddonCAAS')
                      ].filter(Boolean).join(', ') || '-'}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

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

