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
  const currentUrl = window.location.origin + location.pathname;
  const allLanguageUrls = getAllLanguageUrls(location.pathname);

  // Default SEO values
  const defaultTitle = getTranslation(currentLanguage, 'welcome');
  const defaultDescription = getTranslation(currentLanguage, 'subtitle');
  
  const seoTitle = title || defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || `${window.location.origin}/images/sdeal-logo-social.png`;

  // Generate hreflang tags for all languages
  const hreflangTags = Object.entries(allLanguageUrls).map(([lang, url]) => ({
    rel: 'alternate',
    hreflang: lang,
    href: `${window.location.origin}${url}`
  }));

  // Add x-default hreflang
  hreflangTags.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${window.location.origin}${allLanguageUrls.en}`
  });

  return (
    <Helmet>
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
      <meta property="og:site_name" content="SDeal" />
      <meta property="og:locale" content={currentLanguage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      
      {/* Language Alternates */}
      {hreflangTags.map((tag, index) => (
        <link key={index} rel={tag.rel} hreflang={tag.hreflang} href={tag.href} />
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
          "url": window.location.origin,
          "logo": `${window.location.origin}/images/logo_sdeal_navbar.svg`,
          "description": seoDescription,
          "sameAs": [
            "https://www.sdeal.nl",
            "https://www.sdeal.de",
            "https://www.sdeal.fr",
            "https://www.sdeal.it",
            "https://www.sdeal.dk",
            "https://www.sdeal.at"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead; 