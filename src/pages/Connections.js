import React from 'react';
import './Connections.css';

const Connections = () => {
  const integrations = [
    {
      name: 'Shopify',
      url: 'https://www.shopify.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/shopify.png',
      description: 'Synchronize your Shopify products and orders easily with SDeal for streamlined operations.'
    },
    {
      name: 'WooCommerce',
      url: 'https://woocommerce.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/woocommerce.png',
      description: 'Connect WooCommerce to SDeal for automated syncing of orders, customers, and product updates.'
    },
    {
      name: 'Lightspeed',
      url: 'https://www.lightspeedhq.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/lightspeedhq.png',
      description: 'Integrate Lightspeed with SDeal to manage inventory and orders from one central location.'
    },
    {
      name: 'Channable',
      url: 'https://www.channable.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/channable.png',
      description: 'Use Channable to manage your feed and connect it to SDeal for seamless product data integration.'
    },
    {
      name: 'PrestaShop',
      url: 'https://www.prestashop.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/prestashop.png',
      description: 'Connect PrestaShop to SDeal for automated order processing and synchronized inventory management.'
    },
    {
      name: 'BaseLinker',
      url: 'https://www.baselinker.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/baselinker.png',
      description: 'BaseLinker integrates smoothly with SDeal to support multi-channel sales and centralize all order flows.'
    },
    {
      name: 'ChannelEngine',
      url: 'https://www.channelengine.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/channelengine.png',
      description: 'Connect ChannelEngine with SDeal to manage marketplace sales and sync inventory and orders.'
    },
    {
      name: 'EffectConnect',
      url: 'https://www.effectconnect.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/effectconnect.png',
      description: 'EffectConnect links your marketplaces to SDeal and streamlines order and inventory processes.'
    },
    {
      name: 'Magento 2',
      url: 'https://magento.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/magento.png',
      description: 'SDeal supports advanced Magento 2 integration with real-time product, customer, and order syncing.'
    },
    {
      name: 'GoedGepickt',
      url: 'https://www.goedgepickt.nl',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/goedgepickt.png',
      description: 'With GoedGepickt, manage your warehouse directly from SDeal and automate stock updates and order fulfillment.'
    },
    {
      name: 'BigCommerce',
      url: 'https://www.bigcommerce.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/bigcommerce.png',
      description: 'Easily connect BigCommerce to SDeal for global sales and automated syncing of products and orders.'
    },
    {
      name: 'ProductFlow',
      url: 'https://www.productflow.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/productflow.png',
      description: 'Manage all your product content, inventory, and order flows from one place with ProductFlow + SDeal.'
    }
  ];

  return (
    <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
      <div className="w3-container w3-padding-64">
        <h3 className="w3-border-bottom w3-border-light-grey w3-padding-16">
          Connect Your Shop with SDeal
        </h3>
        <p>
          SDeal offers seamless integrations with the most commonly used e-commerce systems. 
          This allows sellers to quickly and easily connect their webshop, order handling, and product feeds to our platform.
        </p>

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
              <p>{integration.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Connections; 