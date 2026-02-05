import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import './Package.css';

const Package = () => {
  const { currentLanguage } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get sellerId, newCustomer, package, and payment success from URL parameters
  const urlSellerId = searchParams.get('sellerId');
  const urlNewCustomer = searchParams.get('newCustomer') === 'true';
  const urlPackageParam = searchParams.get('package');
  const paymentSuccess = searchParams.get('payment') === 'success';
  
  // Pre-select package from URL when coming from pricing page (package=A|B|C)
  const initialPackage = (urlPackageParam === 'A' || urlPackageParam === 'B' || urlPackageParam === 'C') ? urlPackageParam : '';
  
  // Customer type: null = not selected, 'new' = new customer, 'existing' = existing customer
  // If newCustomer=true in URL, automatically set to 'new'
  const [customerType, setCustomerType] = useState(urlNewCustomer ? 'new' : null);
  const [showSellerInfo, setShowSellerInfo] = useState(urlNewCustomer || !urlSellerId);
  const [selectedPackage, setSelectedPackage] = useState(initialPackage);
  const [selectedAddons, setSelectedAddons] = useState({
    dealCSS: false,
    caas: false
  });
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [sellerId, setSellerId] = useState(urlSellerId || '');
  const [sellerEmail, setSellerEmail] = useState('');
  // Check if we're past January 1, 2026
  const isPast2026 = new Date() > new Date('2026-01-01');
  
  // For new customers, always default to immediate
  // For existing customers, default to 2026-01-01 if before 2026, otherwise immediate
  const [startDate, setStartDate] = useState('immediate');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [sellCountries, setSellCountries] = useState([]); // Country codes: NL, BE, DE, FR, GB, AT, IT, DK, SE
  const [payoutFrequency, setPayoutFrequency] = useState('monthly'); // 'weekly' | 'monthly' for orders via our system
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [packageSelectionId, setPackageSelectionId] = useState(null);
  const [errors, setErrors] = useState({});
  
  // New customer NAW fields
  const [newCustomerData, setNewCustomerData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'NL',
    phone: '',
    email: '',
    kvkNumber: '',
    vatNumber: '',
    iban: '',
    bic: ''
  });

  // Update sellerId when URL parameter changes
  useEffect(() => {
    if (urlSellerId) {
      setSellerId(urlSellerId);
      setShowSellerInfo(false);
      setCustomerType('existing');
      // Note: sellerEmail still needs to be filled in the form below
    }
  }, [urlSellerId]);
  
  // Handle newCustomer URL parameter - automatically show new customer form
  useEffect(() => {
    if (urlNewCustomer && !urlSellerId) {
      setCustomerType('new');
      setShowSellerInfo(true);
      // For new customers, always default to immediate
      setStartDate('immediate');
    }
  }, [urlNewCustomer, urlSellerId]);
  
  // Sync selected package when URL package param changes (e.g. coming from pricing page)
  useEffect(() => {
    const p = searchParams.get('package');
    if (p === 'A' || p === 'B' || p === 'C') {
      setSelectedPackage(p);
    }
  }, [searchParams]);
  
  // Handle customer type selection
  const handleCustomerTypeSelect = (type) => {
    setCustomerType(type);
    if (type === 'existing') {
      setShowSellerInfo(true);
      // For existing customers, set default based on date
      setStartDate(isPast2026 ? 'immediate' : '2026-01-01');
    } else if (type === 'new') {
      // For new customers, always default to immediate
      setStartDate('immediate');
    }
  };

  // Handle package selection
  const handlePackageChange = (packageType) => {
    setSelectedPackage(packageType);
    setErrors({ ...errors, package: '' });
  };

  // Sell country options: current markets + Sweden
  const SELL_COUNTRY_OPTIONS = ['NL', 'BE', 'DE', 'FR', 'GB', 'AT', 'IT', 'DK', 'SE'];
  const toggleSellCountry = (code) => {
    setSellCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
    if (errors.sellCountries) setErrors({ ...errors, sellCountries: '' });
  };

  // Handle addon selection
  const handleAddonChange = (addon) => {
    setSelectedAddons({
      ...selectedAddons,
      [addon]: !selectedAddons[addon]
    });
  };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedPackage) return null;
    
    // Package prices per month
    const packagePrices = {
      'A': 29.00,
      'B': 49.00,
      'C': 99.00
    };
    
    // Add-on prices per month
    const addonPrices = {
      dealCSS: 24.95,
      caas: 39.95
    };
    
    let total = packagePrices[selectedPackage];
    
    // Add add-on prices
    if (selectedAddons.dealCSS) {
      total += addonPrices.dealCSS;
    }
    if (selectedAddons.caas) {
      total += addonPrices.caas;
    }
    
    // Apply yearly discount (30% off)
    if (billingPeriod === 'yearly') {
      total = total * 12 * 0.7; // 30% discount
    }
    
    return total;
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

  // Handle new customer form submission
  const handleNewCustomerSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!newCustomerData.email || newCustomerData.email.trim() === '') {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!newCustomerData.companyName || newCustomerData.companyName.trim() === '') {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!newCustomerData.firstName || newCustomerData.firstName.trim() === '') {
      newErrors.firstName = 'First name is required';
    }
    
    if (!newCustomerData.lastName || newCustomerData.lastName.trim() === '') {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!newCustomerData.street || newCustomerData.street.trim() === '') {
      newErrors.street = 'Street address is required';
    }
    
    if (!newCustomerData.city || newCustomerData.city.trim() === '') {
      newErrors.city = 'City is required';
    }
    
    if (!newCustomerData.postalCode || newCustomerData.postalCode.trim() === '') {
      newErrors.postalCode = 'Postal code is required';
    }
    
    if (!newCustomerData.country || newCustomerData.country.trim() === '') {
      newErrors.country = 'Country is required';
    }
    
    if (!newCustomerData.kvkNumber || newCustomerData.kvkNumber.trim() === '') {
      newErrors.kvkNumber = 'KVK number is required';
    }
    
    if (!newCustomerData.vatNumber || newCustomerData.vatNumber.trim() === '') {
      newErrors.vatNumber = 'VAT number is required';
    }
    
    if (!newCustomerData.iban || newCustomerData.iban.trim() === '') {
      newErrors.iban = 'IBAN is required';
    } else {
      // Basic IBAN validation (should start with 2 letters, then 2 digits, then alphanumeric)
      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
      const ibanUpper = newCustomerData.iban.replace(/\s/g, '').toUpperCase();
      if (!ibanRegex.test(ibanUpper)) {
        newErrors.iban = 'Please enter a valid IBAN';
      }
    }
    
    if (!newCustomerData.bic || newCustomerData.bic.trim() === '') {
      newErrors.bic = 'BIC is required';
    } else {
      // Basic BIC validation (8 or 11 characters, alphanumeric)
      const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
      const bicUpper = newCustomerData.bic.replace(/\s/g, '').toUpperCase();
      if (!bicRegex.test(bicUpper)) {
        newErrors.bic = 'Please enter a valid BIC';
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Set email for later use
      setSellerEmail(newCustomerData.email);
      // Generate a temporary seller ID (will be replaced by backend)
      setSellerId('NEW-' + Date.now());
      setShowSellerInfo(false);
    }
  };
  
  // Handle seller info submission (first step for existing customers)
  const handleSellerInfoSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!sellerEmail || sellerEmail.trim() === '') {
      newErrors.sellerEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
      newErrors.sellerEmail = 'Please enter a valid email address';
    }
    
    // Seller ID is required for existing customers
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
    
    // Seller ID is only required for existing customers, not for new customers
    if (customerType !== 'new' && (!sellerId || sellerId.trim() === '')) {
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
    
    if (!Array.isArray(sellCountries) || sellCountries.length === 0) {
      newErrors.sellCountries = currentLanguage === 'nl'
        ? 'Selecteer minimaal één land waar je wilt verkopen'
        : currentLanguage === 'de'
        ? 'Wählen Sie mindestens ein Land aus, in dem Sie verkaufen möchten'
        : currentLanguage === 'fr'
        ? 'Sélectionnez au moins un pays dans lequel vous souhaitez vendre'
        : 'Select at least one country you want to sell in';
    }
    if (!payoutFrequency || !['weekly', 'monthly'].includes(payoutFrequency)) {
      newErrors.payoutFrequency = currentLanguage === 'nl'
        ? 'Kies wekelijkse of maandelijkse uitbetaling'
        : currentLanguage === 'de'
        ? 'Wählen Sie wöchentliche oder monatliche Auszahlung'
        : currentLanguage === 'fr'
        ? 'Choisissez le paiement hebdomadaire ou mensuel'
        : 'Please choose weekly or monthly payout';
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
      const requestBody = {
          package: selectedPackage,
          addons: selectedAddons,
          agreementAccepted: agreementAccepted,
          language: currentLanguage,
          sellerEmail: sellerEmail.trim(),
          startDate: startDate,
          commissionPercentage: commissionPercentage ? parseFloat(commissionPercentage) : null,
          billingPeriod: billingPeriod,
          sellCountries: sellCountries,
          payoutFrequency: payoutFrequency
      };
      
      // Add seller ID only for existing customers (not for new customers)
      if (customerType !== 'new' && sellerId && sellerId.trim() !== '') {
        requestBody.sellerId = sellerId.trim();
      }
      
      // Add new customer data if it's a new customer
      if (customerType === 'new') {
        requestBody.newCustomer = true;
        requestBody.customerData = newCustomerData;
        // Don't send sellerId for new customers - it will be generated in Magento
        console.log('Sending new customer data:', JSON.stringify(newCustomerData, null, 2));
        console.log('Customer data fields:', {
          street: newCustomerData.street,
          kvkNumber: newCustomerData.kvkNumber,
          vatNumber: newCustomerData.vatNumber,
          iban: newCustomerData.iban
        });
      }
      
      console.log('Full request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/package/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
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
        // Store package selection ID for payment
        if (result.data && result.data.id) {
          setPackageSelectionId(result.data.id);
        }
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


  // Payment functionality
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  
  const handlePaymentClick = async () => {
    if (!packageSelectionId) {
      console.error('No package selection ID available');
      setErrors({ 
        ...errors, 
        payment: 'No package selection found. Please try submitting again.' 
      });
      return;
    }

    setIsCreatingPayment(true);
    setErrors({ ...errors, payment: '' });

    try {
      const response = await fetch('/api/package/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageSelectionId: packageSelectionId
        })
      });

      // Check if response is ok
      if (!response.ok) {
        // Clone response to read it multiple times if needed
        const clonedResponse = response.clone();
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await clonedResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            // If both fail, use status message
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Redirect to Mollie payment page
        window.location.href = result.paymentUrl;
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setErrors({ 
        ...errors, 
        payment: error.message || 'Failed to create payment. Please try again.' 
      });
      setIsCreatingPayment(false);
    }
  };

  // Show payment success page if payment=success in URL
  if (paymentSuccess) {
    return (
      <div className="package-container">
        <SEOHead 
          title={`Payment Successful - SDeal`}
          description="Your payment has been processed successfully"
        />
        <div className="package-success">
          <div className="success-icon">✓</div>
          <h1>{getTranslation(currentLanguage, 'paymentSuccessTitle')}</h1>
          <p>{getTranslation(currentLanguage, 'paymentSuccessMessage')}</p>
          <p style={{ fontSize: '16px', color: '#666', marginTop: '20px' }}>
            {getTranslation(currentLanguage, 'paymentSuccessDetails')}
          </p>
        </div>
      </div>
    );
  }

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
          
          {packageSelectionId && (
            <div style={{ marginTop: '30px' }}>
              <button
                onClick={handlePaymentClick}
                className="cta-button"
                disabled={isCreatingPayment}
                style={{ marginTop: '20px' }}
              >
                {isCreatingPayment 
                  ? 'Processing...' 
                  : getTranslation(currentLanguage, 'proceedToPayment')
                }
              </button>
            </div>
          )}
          
          {errors.payment && (
            <div className="error-message" style={{ marginTop: '20px' }}>
              {errors.payment}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show customer type selection screen if not selected yet
  if (customerType === null && !urlSellerId) {
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

        {/* Customer Type Selection */}
        <section className="package-customer-type-selection">
          <div className="package-content">
            <div className="customer-type-card">
              <h2>{getTranslation(currentLanguage, 'customerTypeTitle')}</h2>
              <div className="customer-type-options">
                <button
                  type="button"
                  className="customer-type-option"
                  onClick={() => handleCustomerTypeSelect('new')}
                >
                  <div className="customer-type-icon">🆕</div>
                  <h3>{getTranslation(currentLanguage, 'customerTypeNew')}</h3>
                  <p>{getTranslation(currentLanguage, 'customerTypeNewDescription')}</p>
                </button>
                <button
                  type="button"
                  className="customer-type-option"
                  onClick={() => handleCustomerTypeSelect('existing')}
                >
                  <div className="customer-type-icon">👤</div>
                  <h3>{getTranslation(currentLanguage, 'customerTypeExisting')}</h3>
                  <p>{getTranslation(currentLanguage, 'customerTypeExistingDescription')}</p>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show new customer form
  if (customerType === 'new' && showSellerInfo) {
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

        {/* New Customer Registration Form */}
        <section className="package-seller-info-step">
          <div className="package-content">
            <div className="seller-info-card">
              <h2>{getTranslation(currentLanguage, 'newCustomerTitle')}</h2>
              <p className="seller-info-description">{getTranslation(currentLanguage, 'newCustomerDescription')}</p>
              <form onSubmit={handleNewCustomerSubmit} className="seller-info-form">
                <div className="form-group">
                  <label htmlFor="companyName">{getTranslation(currentLanguage, 'companyNameLabel')}</label>
                  <input
                    id="companyName"
                    type="text"
                    className={`form-input ${errors.companyName ? 'error' : ''}`}
                    placeholder={getTranslation(currentLanguage, 'companyNamePlaceholder')}
                    value={newCustomerData.companyName}
                    onChange={(e) => {
                      setNewCustomerData({ ...newCustomerData, companyName: e.target.value });
                      setErrors({ ...errors, companyName: '' });
                    }}
                    required
                  />
                  {errors.companyName && <div className="error-message">{errors.companyName}</div>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">{getTranslation(currentLanguage, 'firstNameLabel')}</label>
                    <input
                      id="firstName"
                      type="text"
                      className={`form-input ${errors.firstName ? 'error' : ''}`}
                      placeholder={getTranslation(currentLanguage, 'firstNamePlaceholder')}
                      value={newCustomerData.firstName}
                      onChange={(e) => {
                        setNewCustomerData({ ...newCustomerData, firstName: e.target.value });
                        setErrors({ ...errors, firstName: '' });
                      }}
                      required
                    />
                    {errors.firstName && <div className="error-message">{errors.firstName}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">{getTranslation(currentLanguage, 'lastNameLabel')}</label>
                    <input
                      id="lastName"
                      type="text"
                      className={`form-input ${errors.lastName ? 'error' : ''}`}
                      placeholder={getTranslation(currentLanguage, 'lastNamePlaceholder')}
                      value={newCustomerData.lastName}
                      onChange={(e) => {
                        setNewCustomerData({ ...newCustomerData, lastName: e.target.value });
                        setErrors({ ...errors, lastName: '' });
                      }}
                      required
                    />
                    {errors.lastName && <div className="error-message">{errors.lastName}</div>}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">{getTranslation(currentLanguage, 'sellerEmailLabel')}</label>
                  <input
                    id="email"
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder={getTranslation(currentLanguage, 'sellerEmailPlaceholder')}
                    value={newCustomerData.email}
                    onChange={(e) => {
                      setNewCustomerData({ ...newCustomerData, email: e.target.value });
                      setErrors({ ...errors, email: '' });
                    }}
                    required
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="street">{getTranslation(currentLanguage, 'streetLabel')}</label>
                  <input
                    id="street"
                    type="text"
                    className={`form-input ${errors.street ? 'error' : ''}`}
                    placeholder={getTranslation(currentLanguage, 'streetPlaceholder')}
                    value={newCustomerData.street}
                    onChange={(e) => {
                      setNewCustomerData({ ...newCustomerData, street: e.target.value });
                      setErrors({ ...errors, street: '' });
                    }}
                    required
                  />
                  {errors.street && <div className="error-message">{errors.street}</div>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="postalCode">{getTranslation(currentLanguage, 'postalCodeLabel')}</label>
                    <input
                      id="postalCode"
                      type="text"
                      className={`form-input ${errors.postalCode ? 'error' : ''}`}
                      placeholder={getTranslation(currentLanguage, 'postalCodePlaceholder')}
                      value={newCustomerData.postalCode}
                      onChange={(e) => {
                        setNewCustomerData({ ...newCustomerData, postalCode: e.target.value });
                        setErrors({ ...errors, postalCode: '' });
                      }}
                      required
                    />
                    {errors.postalCode && <div className="error-message">{errors.postalCode}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="city">{getTranslation(currentLanguage, 'cityLabel')}</label>
                    <input
                      id="city"
                      type="text"
                      className={`form-input ${errors.city ? 'error' : ''}`}
                      placeholder={getTranslation(currentLanguage, 'cityPlaceholder')}
                      value={newCustomerData.city}
                      onChange={(e) => {
                        setNewCustomerData({ ...newCustomerData, city: e.target.value });
                        setErrors({ ...errors, city: '' });
                      }}
                      required
                    />
                    {errors.city && <div className="error-message">{errors.city}</div>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="country">{getTranslation(currentLanguage, 'countryLabel')}</label>
                    <select
                      id="country"
                      className={`form-input ${errors.country ? 'error' : ''}`}
                      value={newCustomerData.country}
                      onChange={(e) => {
                        setNewCustomerData({ ...newCustomerData, country: e.target.value });
                        setErrors({ ...errors, country: '' });
                      }}
                      required
                    >
                      <option value="NL">{getTranslation(currentLanguage, 'countryNL')}</option>
                      <option value="BE">{getTranslation(currentLanguage, 'countryBE')}</option>
                      <option value="DE">{getTranslation(currentLanguage, 'countryDE')}</option>
                      <option value="FR">{getTranslation(currentLanguage, 'countryFR')}</option>
                      <option value="GB">{getTranslation(currentLanguage, 'countryGB')}</option>
                      <option value="AT">{getTranslation(currentLanguage, 'countryAT')}</option>
                      <option value="IT">{getTranslation(currentLanguage, 'countryIT')}</option>
                      <option value="DK">{getTranslation(currentLanguage, 'countryDK')}</option>
                    </select>
                    {errors.country && <div className="error-message">{errors.country}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">{getTranslation(currentLanguage, 'phoneLabel')}</label>
                    <input
                      id="phone"
                      type="tel"
                      className="form-input"
                      placeholder={getTranslation(currentLanguage, 'phonePlaceholder')}
                      value={newCustomerData.phone}
                      onChange={(e) => {
                        setNewCustomerData({ ...newCustomerData, phone: e.target.value });
                      }}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="kvkNumber">{getTranslation(currentLanguage, 'kvkNumberLabel')}</label>
                  <input
                    id="kvkNumber"
                    type="text"
                    className={`form-input ${errors.kvkNumber ? 'error' : ''}`}
                    placeholder={getTranslation(currentLanguage, 'kvkNumberPlaceholder')}
                    value={newCustomerData.kvkNumber}
                    onChange={(e) => {
                      setNewCustomerData({ ...newCustomerData, kvkNumber: e.target.value });
                      setErrors({ ...errors, kvkNumber: '' });
                    }}
                    required
                  />
                  {errors.kvkNumber && <div className="error-message">{errors.kvkNumber}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="vatNumber">{getTranslation(currentLanguage, 'vatNumberLabel')}</label>
                  <input
                    id="vatNumber"
                    type="text"
                    className={`form-input ${errors.vatNumber ? 'error' : ''}`}
                    placeholder={getTranslation(currentLanguage, 'vatNumberPlaceholder')}
                    value={newCustomerData.vatNumber}
                    onChange={(e) => {
                      setNewCustomerData({ ...newCustomerData, vatNumber: e.target.value });
                      setErrors({ ...errors, vatNumber: '' });
                    }}
                    required
                  />
                  {errors.vatNumber && <div className="error-message">{errors.vatNumber}</div>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="iban">{getTranslation(currentLanguage, 'ibanLabel')}</label>
                    <input
                      id="iban"
                      type="text"
                      className={`form-input ${errors.iban ? 'error' : ''}`}
                      placeholder={getTranslation(currentLanguage, 'ibanPlaceholder')}
                      value={newCustomerData.iban}
                      onChange={(e) => {
                        // Remove spaces and convert to uppercase for validation
                        const value = e.target.value.replace(/\s/g, '').toUpperCase();
                        setNewCustomerData({ ...newCustomerData, iban: value });
                        setErrors({ ...errors, iban: '' });
                      }}
                      required
                    />
                    {errors.iban && <div className="error-message">{errors.iban}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bic">{getTranslation(currentLanguage, 'bicLabel')}</label>
                    <input
                      id="bic"
                      type="text"
                      className={`form-input ${errors.bic ? 'error' : ''}`}
                      placeholder={getTranslation(currentLanguage, 'bicPlaceholder')}
                      value={newCustomerData.bic}
                      onChange={(e) => {
                        // Remove spaces and convert to uppercase for validation
                        const value = e.target.value.replace(/\s/g, '').toUpperCase();
                        setNewCustomerData({ ...newCustomerData, bic: value });
                        setErrors({ ...errors, bic: '' });
                      }}
                      required
                    />
                    {errors.bic && <div className="error-message">{errors.bic}</div>}
                  </div>
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

  // Show seller info form if sellerId is not in URL (existing customer)
  if (showSellerInfo && customerType === 'existing') {
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
          
          {/* Seller ID Display - Read-only if from URL, hidden for new customers */}
          {customerType !== 'new' && (
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
          )}

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
              {/* Only show future date option for existing customers and if before 2026 */}
              {customerType !== 'new' && !isPast2026 && (
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
              )}
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

          {/* Sell countries & payout frequency - shown when package selected */}
          {selectedPackage && (
            <>
              <section className="package-sell-countries">
                <h2>{getTranslation(currentLanguage, 'sellCountriesTitle')}</h2>
                <p className="form-hint">{getTranslation(currentLanguage, 'sellCountriesHint')}</p>
                <div className="sell-countries-list">
                  {SELL_COUNTRY_OPTIONS.map((code) => (
                    <label key={code} className="sell-country-item">
                      <input
                        type="checkbox"
                        checked={sellCountries.includes(code)}
                        onChange={() => toggleSellCountry(code)}
                      />
                      <span>{getTranslation(currentLanguage, `country${code}`)}</span>
                    </label>
                  ))}
                </div>
                {errors.sellCountries && <div className="error-message">{errors.sellCountries}</div>}
              </section>
              <section className="package-payout-frequency">
                <h2>{getTranslation(currentLanguage, 'payoutFrequencyTitle')}</h2>
                <div className="payout-frequency-options">
                  <label className={`payout-frequency-option ${payoutFrequency === 'monthly' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payoutFrequency"
                      value="monthly"
                      checked={payoutFrequency === 'monthly'}
                      onChange={() => { setPayoutFrequency('monthly'); setErrors({ ...errors, payoutFrequency: '' }); }}
                    />
                    <span>{getTranslation(currentLanguage, 'payoutFrequencyMonthly')}</span>
                  </label>
                  <label className={`payout-frequency-option ${payoutFrequency === 'weekly' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payoutFrequency"
                      value="weekly"
                      checked={payoutFrequency === 'weekly'}
                      onChange={() => { setPayoutFrequency('weekly'); setErrors({ ...errors, payoutFrequency: '' }); }}
                    />
                    <span>{getTranslation(currentLanguage, 'payoutFrequencyWeekly')}</span>
                  </label>
                </div>
                {errors.payoutFrequency && <div className="error-message">{errors.payoutFrequency}</div>}
              </section>
            </>
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
              <a href="/images/SDeal Seller Terms & Conditions.pdf" target="_blank" rel="noopener noreferrer">
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
            {customerType !== 'new' && (
              <>
                <p className="legal-note">{getTranslation(currentLanguage, 'packageLegalNote1')}</p>
                <p className="legal-note-small">{getTranslation(currentLanguage, 'packageLegalNote2')}</p>
              </>
            )}
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
                {sellerId && customerType !== 'new' && (
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
                      : startDate === '2026-01-01'
                      ? getTranslation(currentLanguage, 'startDate2026')
                      : startDate
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
                {sellCountries.length > 0 && (
                  <div className="summary-item">
                    <span className="summary-label">{getTranslation(currentLanguage, 'sellCountriesTitle')}:</span>
                    <span className="summary-value">
                      {sellCountries.map(code => getTranslation(currentLanguage, `country${code}`)).join(', ')}
                    </span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">{getTranslation(currentLanguage, 'payoutFrequencyTitle')}:</span>
                  <span className="summary-value">
                    {payoutFrequency === 'monthly'
                      ? getTranslation(currentLanguage, 'payoutFrequencyMonthly')
                      : getTranslation(currentLanguage, 'payoutFrequencyWeekly')
                    }
                  </span>
                </div>
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
                {calculateTotalPrice() !== null && (
                  <div className="summary-item summary-total">
                    <span className="summary-label">{getTranslation(currentLanguage, 'packageSummaryTotal')}:</span>
                    <span className="summary-value summary-total-price">
                      €{calculateTotalPrice().toFixed(2)} {billingPeriod === 'monthly' 
                        ? getTranslation(currentLanguage, 'packageSummaryTotalPerMonth')
                        : getTranslation(currentLanguage, 'packageSummaryTotalPerYear')
                      }
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

