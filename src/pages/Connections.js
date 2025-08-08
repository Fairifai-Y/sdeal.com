import React from 'react';
import SEOHead from '../components/SEOHead';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Connections.css';

const Connections = () => {
  const { currentLanguage } = useLanguage();

  const getLanguageName = (lang) => {
    const names = {
      en: 'English',
      nl: 'Nederlands',
      de: 'Deutsch',
      fr: 'Français'
    };
    return names[lang] || 'English';
  };

  const integrations = [
    {
      name: 'Shopify',
      url: 'https://www.shopify.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/shopify.png',
      description: {
        en: 'Synchronize your Shopify products and orders easily with SDeal for streamlined operations.',
        nl: 'Synchroniseer uw Shopify producten en bestellingen eenvoudig met SDeal voor gestroomlijnde operaties.',
        de: 'Synchronisieren Sie Ihre Shopify-Produkte und -Bestellungen einfach mit SDeal für optimierte Abläufe.',
        fr: 'Synchronisez facilement vos produits et commandes Shopify avec SDeal pour des opérations optimisées.'
      }
    },
    {
      name: 'WooCommerce',
      url: 'https://woocommerce.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/woocommerce.png',
      description: {
        en: 'Connect WooCommerce to SDeal for automated syncing of orders, customers, and product updates.',
        nl: 'Verbind WooCommerce met SDeal voor geautomatiseerde synchronisatie van bestellingen, klanten en productupdates.',
        de: 'Verbinden Sie WooCommerce mit SDeal für die automatisierte Synchronisierung von Bestellungen, Kunden und Produktaktualisierungen.',
        fr: 'Connectez WooCommerce à SDeal pour la synchronisation automatique des commandes, clients et mises à jour de produits.'
      }
    },
    {
      name: 'Lightspeed',
      url: 'https://www.lightspeedhq.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/lightspeedhq.png',
      description: {
        en: 'Integrate Lightspeed with SDeal to manage inventory and orders from one central location.',
        nl: 'Integreer Lightspeed met SDeal om voorraad en bestellingen vanaf één centrale locatie te beheren.',
        de: 'Integrieren Sie Lightspeed mit SDeal, um Bestand und Bestellungen von einem zentralen Standort aus zu verwalten.',
        fr: 'Intégrez Lightspeed avec SDeal pour gérer les stocks et commandes depuis un emplacement central.'
      }
    },
    {
      name: 'Channable',
      url: 'https://www.channable.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/channable.png',
      description: {
        en: 'Use Channable to manage your feed and connect it to SDeal for seamless product data integration.',
        nl: 'Gebruik Channable om uw feed te beheren en deze te verbinden met SDeal voor naadloze productdata-integratie.',
        de: 'Verwenden Sie Channable, um Ihren Feed zu verwalten und ihn mit SDeal für nahtlose Produktdatenintegration zu verbinden.',
        fr: 'Utilisez Channable pour gérer votre flux et le connecter à SDeal pour une intégration transparente des données produits.'
      }
    },
    {
      name: 'PrestaShop',
      url: 'https://www.prestashop.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/prestashop.png',
      description: {
        en: 'Connect PrestaShop to SDeal for automated order processing and synchronized inventory management.',
        nl: 'Verbind PrestaShop met SDeal voor geautomatiseerde orderverwerking en gesynchroniseerde voorraadbeheer.',
        de: 'Verbinden Sie PrestaShop mit SDeal für automatisierte Auftragsverarbeitung und synchronisiertes Bestandsmanagement.',
        fr: 'Connectez PrestaShop à SDeal pour le traitement automatisé des commandes et la gestion synchronisée des stocks.'
      }
    },
    {
      name: 'BaseLinker',
      url: 'https://www.baselinker.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/baselinker.png',
      description: {
        en: 'BaseLinker integrates smoothly with SDeal to support multi-channel sales and centralize all order flows.',
        nl: 'BaseLinker integreert naadloos met SDeal om multi-channel verkoop te ondersteunen en alle orderstromen te centraliseren.',
        de: 'BaseLinker integriert sich nahtlos mit SDeal, um Multi-Channel-Verkäufe zu unterstützen und alle Bestellabläufe zu zentralisieren.',
        fr: 'BaseLinker s\'intègre parfaitement avec SDeal pour soutenir les ventes multi-canaux et centraliser tous les flux de commandes.'
      }
    },
    {
      name: 'ChannelEngine',
      url: 'https://www.channelengine.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/channelengine.png',
      description: {
        en: 'Connect ChannelEngine with SDeal to manage marketplace sales and sync inventory and orders.',
        nl: 'Verbind ChannelEngine met SDeal om marketplace verkopen te beheren en voorraad en bestellingen te synchroniseren.',
        de: 'Verbinden Sie ChannelEngine mit SDeal, um Marketplace-Verkäufe zu verwalten und Bestand und Bestellungen zu synchronisieren.',
        fr: 'Connectez ChannelEngine avec SDeal pour gérer les ventes marketplace et synchroniser les stocks et commandes.'
      }
    },
    {
      name: 'EffectConnect',
      url: 'https://www.effectconnect.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/effectconnect.png',
      description: {
        en: 'EffectConnect links your marketplaces to SDeal and streamlines order and inventory processes.',
        nl: 'EffectConnect koppelt uw marketplaces aan SDeal en stroomlijnt order- en voorraadprocessen.',
        de: 'EffectConnect verknüpft Ihre Marktplätze mit SDeal und optimiert Bestell- und Bestandsprozesse.',
        fr: 'EffectConnect relie vos marketplaces à SDeal et optimise les processus de commandes et de stocks.'
      }
    },
    {
      name: 'Magento 2',
      url: 'https://magento.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/magento.png',
      description: {
        en: 'SDeal supports advanced Magento 2 integration with real-time product, customer, and order syncing.',
        nl: 'SDeal ondersteunt geavanceerde Magento 2 integratie met real-time product-, klant- en ordersynchronisatie.',
        de: 'SDeal unterstützt fortschrittliche Magento 2-Integration mit Echtzeit-Synchronisierung von Produkten, Kunden und Bestellungen.',
        fr: 'SDeal prend en charge l\'intégration avancée de Magento 2 avec la synchronisation en temps réel des produits, clients et commandes.'
      }
    },
    {
      name: 'GoedGepickt',
      url: 'https://www.goedgepickt.nl',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/goedgepickt.png',
      description: {
        en: 'With GoedGepickt, manage your warehouse directly from SDeal and automate stock updates and order fulfillment.',
        nl: 'Met GoedGepickt beheert u uw magazijn direct vanuit SDeal en automatiseert u voorraadupdates en orderafhandeling.',
        de: 'Mit GoedGepickt verwalten Sie Ihr Lager direkt von SDeal aus und automatisieren Bestandsaktualisierungen und Auftragsabwicklung.',
        fr: 'Avec GoedGepickt, gérez votre entrepôt directement depuis SDeal et automatisez les mises à jour de stocks et l\'exécution des commandes.'
      }
    },
    {
      name: 'BigCommerce',
      url: 'https://www.bigcommerce.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/bigcommerce.png',
      description: {
        en: 'Easily connect BigCommerce to SDeal for global sales and automated syncing of products and orders.',
        nl: 'Verbind BigCommerce eenvoudig met SDeal voor wereldwijde verkopen en geautomatiseerde synchronisatie van producten en bestellingen.',
        de: 'Verbinden Sie BigCommerce einfach mit SDeal für globale Verkäufe und automatisierte Synchronisierung von Produkten und Bestellungen.',
        fr: 'Connectez facilement BigCommerce à SDeal pour les ventes mondiales et la synchronisation automatisée des produits et commandes.'
      }
    },
    {
      name: 'ProductFlow',
      url: 'https://www.productflow.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/productflow.png',
      description: {
        en: 'Manage all your product content, inventory, and order flows from one place with ProductFlow + SDeal.',
        nl: 'Beheer al uw productinhoud, voorraad en orderstromen vanaf één plek met ProductFlow + SDeal.',
        de: 'Verwalten Sie all Ihre Produktinhalte, Bestand und Bestellabläufe von einem Ort aus mit ProductFlow + SDeal.',
        fr: 'Gérez tout votre contenu produit, stocks et flux de commandes depuis un seul endroit avec ProductFlow + SDeal.'
      }
    }
  ];

  return (
    <div className="connections-container">
      <SEOHead />
      <div className="w3-content w3-padding-64">
        <div className="connections-header">
          <h1 className="w3-center">
            {getTranslation(currentLanguage, 'connections')}
          </h1>
          <div className="language-indicator">
            <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="language-name">{getLanguageName(currentLanguage)}</span>
          </div>
        </div>
        
        <div className="connections-intro">
          <p className="w3-center w3-large">
            {getTranslation(currentLanguage, 'connectionsIntro')}
          </p>
        </div>

        <div className="integrations-grid">
          {integrations.map((integration, index) => (
            <div key={index} className="integration-card">
              <a href={integration.url} target="_blank" rel="noopener noreferrer">
                <img 
                  src={integration.image} 
                  alt={integration.name} 
                  className="integration-logo"
                />
              </a>
              <p>{integration.description[currentLanguage] || integration.description.en}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Connections; 