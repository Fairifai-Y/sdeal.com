import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { getAllLanguageUrls } from '../utils/languageUtils';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ 
  title, 
  description, 
  keywords, 
  image, 
  type = 'website',
  structuredData = null 
}) => {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  
  // Safety check for window.location.origin
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.sdeal.com';
  const currentUrl = origin + location.pathname;
  const allLanguageUrls = getAllLanguageUrls(location.pathname);

  // Uniform title/description across the site per requested tagline
  const taglineByLang = {
    en: 'Your reliable shopping connection',
    nl: 'Jouw betrouwbare winkelverbinding',
    de: 'Deine zuverlässige Einkaufverbindung',
    fr: 'Votre connexion shopping fiable'
  };

  const tagline = taglineByLang[currentLanguage] || taglineByLang.en;

  // Always enforce the requested title format; allow description override if provided
  const seoTitle = `SDeal.com - ${tagline}`;
  const seoDescription = description || tagline;
  // Use existing public image as default social image
  const seoImage = image || `${origin}/images/Logo.png`;

  // Map to valid Open Graph locale codes
  const ogLocaleMap = {
    en: 'en_US',
    nl: 'nl_NL',
    de: 'de_DE',
    fr: 'fr_FR'
  };
  const ogLocale = ogLocaleMap[currentLanguage] || 'en_US';

  // Generate hreflang tags for all languages
  const hreflangTags = [];
  
  if (allLanguageUrls && typeof allLanguageUrls === 'object') {
    Object.entries(allLanguageUrls).forEach(([lang, url]) => {
      if (lang && url) {
        hreflangTags.push({
          rel: 'alternate',
          hreflang: lang,
          href: `${origin}${url}`
        });
      }
    });
  }

  // Add x-default hreflang
  if (allLanguageUrls && allLanguageUrls.en) {
    hreflangTags.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${origin}${allLanguageUrls.en}`
    });
  }

  return (
    <Helmet htmlAttributes={{ lang: currentLanguage }}>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={keywords || 'SDeal, marketplace, Europe, online shopping'} />
      <meta name="author" content="SDeal" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content={currentLanguage} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:secure_url" content={seoImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="SDeal - Your reliable shopping connection across Europe" />
      <meta property="og:site_name" content="SDeal" />
      <meta property="og:locale" content={ogLocale} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:image:alt" content="SDeal logo" />
      
      {/* Language Alternates */}
      {hreflangTags.map((tag, index) => (
        <link key={index} rel={tag.rel} hreflang={tag.hreflang} href={tag.href} />
      ))}
      {/* Open Graph locale alternates */}
      {Object.keys(allLanguageUrls || {}).map((lang) => (
        <meta key={`og-alt-${lang}`} property="og:locale:alternate" content={ogLocaleMap[lang] || 'en_US'} />
      ))}
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
             {/* Default Structured Data for Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "SDeal",
          "url": origin,
          "logo": `${origin}/images/logo_sdeal_navbar.svg`,
          "description": seoDescription,
          "sameAs": [
            "https://www.sdeal.nl",
            "https://www.sdeal.de",
            "https://www.sdeal.fr",
            "https://www.sdeal.it",
            "https://www.sdeal.dk",
            "https://www.sdeal.at"
          ],
          "contactPoint": [{
            "@type": "ContactPoint",
            "telephone": "+31 850 250 182",
            "contactType": "customer service",
            "email": "customerservice@sdeal.com",
            "areaServed": ["NL","DE","FR","EU"],
            "availableLanguage": ["en","nl","de","fr"]
          }],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Osloweg 110",
            "postalCode": "9723 BX",
            "addressLocality": "Groningen",
            "addressCountry": "NL"
          },
          "foundingDate": "2020",
          "numberOfEmployees": "10-50",
          "industry": "E-commerce",
          "knowsAbout": ["Marketplace", "E-commerce", "European retail", "Online shopping"]
        })}
      </script>
      
      {/* WebSite structured data for homepage */}
      {location.pathname === '/' && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "SDeal",
            "url": origin,
            "description": seoDescription,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${origin}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            },
            "publisher": {
              "@type": "Organization",
              "name": "SDeal",
              "logo": {
                "@type": "ImageObject",
                "url": `${origin}/images/logo_sdeal_navbar.svg`
              }
            }
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead; 