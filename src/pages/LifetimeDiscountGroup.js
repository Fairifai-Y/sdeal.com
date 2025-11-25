import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import './LifetimeDiscountGroup.css';

const LifetimeDiscountGroup = () => {
  const { currentLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const paymentStatus = searchParams.get('payment');

  const translations = {
    en: {
      title: 'Lifetime Discount Group',
      subtitle: 'Enter your email address to secure lifetime discounts on SDeal',
      emailPlaceholder: 'Your email address',
      emailLabel: 'Email Address',
      payButton: 'Pay €14.95',
      processing: 'Processing...',
      successTitle: 'Thank you for joining the Lifetime Discount Group',
      successMessage: 'Your account will be available for lifetime discounts within 24 hours.',
      errorMessage: 'An error occurred. Please try again.',
      emailRequired: 'Please enter your email address',
      emailInvalid: 'Please enter a valid email address'
    },
    nl: {
      title: 'Lifetime Discount Group',
      subtitle: 'Vul je emailadres in waar je levenslange korting op SDeal wil vastleggen',
      emailPlaceholder: 'Je emailadres',
      emailLabel: 'Emailadres',
      payButton: 'Betaal €14,95',
      processing: 'Verwerken...',
      successTitle: 'Bedankt voor het aanmelden voor de Lifetime-Discount Group',
      successMessage: 'Uiterlijk na 24 uur is jouw account beschikbaar voor levenslange korting.',
      errorMessage: 'Er is een fout opgetreden. Probeer het opnieuw.',
      emailRequired: 'Vul je emailadres in',
      emailInvalid: 'Vul een geldig emailadres in'
    },
    de: {
      title: 'Lifetime Discount Group',
      subtitle: 'Geben Sie Ihre E-Mail-Adresse ein, um lebenslange Rabatte auf SDeal zu sichern',
      emailPlaceholder: 'Ihre E-Mail-Adresse',
      emailLabel: 'E-Mail-Adresse',
      payButton: '€14,95 bezahlen',
      processing: 'Wird verarbeitet...',
      successTitle: 'Vielen Dank für den Beitritt zur Lifetime Discount Group',
      successMessage: 'Ihr Konto wird innerhalb von 24 Stunden für lebenslange Rabatte verfügbar sein.',
      errorMessage: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      emailRequired: 'Bitte geben Sie Ihre E-Mail-Adresse ein',
      emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    },
    fr: {
      title: 'Lifetime Discount Group',
      subtitle: 'Entrez votre adresse e-mail pour sécuriser des réductions à vie sur SDeal',
      emailPlaceholder: 'Votre adresse e-mail',
      emailLabel: 'Adresse e-mail',
      payButton: 'Payer 14,95 €',
      processing: 'Traitement en cours...',
      successTitle: 'Merci d\'avoir rejoint le Lifetime Discount Group',
      successMessage: 'Votre compte sera disponible pour des réductions à vie dans les 24 heures.',
      errorMessage: 'Une erreur s\'est produite. Veuillez réessayer.',
      emailRequired: 'Veuillez entrer votre adresse e-mail',
      emailInvalid: 'Veuillez entrer une adresse e-mail valide'
    }
  };

  const t = translations[currentLanguage] || translations.en;

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t.emailRequired);
      return;
    }

    if (!validateEmail(email)) {
      setError(t.emailInvalid);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/lifetime-discount/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, language: currentLanguage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorMessage);
      }

      if (data.paymentUrl) {
        // Redirect to Mollie payment page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(t.errorMessage);
      }
    } catch (err) {
      setError(err.message || t.errorMessage);
      setLoading(false);
    }
  };

  // Show success page if payment was successful
  if (paymentStatus === 'success') {
    return (
      <div className="lifetime-discount-page">
        <SEOHead 
          title={t.successTitle}
          description={t.successMessage}
        />
        <div className="container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>{t.successTitle}</h1>
            <p>{t.successMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lifetime-discount-page">
      <SEOHead 
        title={t.title}
        description={t.subtitle}
      />
      <div className="container">
        <div className="lifetime-discount-content">
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
          
          <form onSubmit={handleSubmit} className="lifetime-discount-form">
            <div className="form-group">
              <label htmlFor="email">{t.emailLabel}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="pay-button"
              disabled={loading}
            >
              {loading ? t.processing : t.payButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LifetimeDiscountGroup;

