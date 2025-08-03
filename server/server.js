const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SDeal API is running' });
});

app.get('/api/countries', (req, res) => {
  const countries = [
    {
      name: 'Netherlands',
      url: 'https://www.sdeal.nl',
      image: '/images/netherlands.png',
      flag: 'https://www.sdeal.nl/media/images/Nederlandse_vlag.png'
    },
    {
      name: 'Germany',
      url: 'https://www.sdeal.de',
      image: '/images/germany.png',
      flag: 'https://www.sdeal.nl/media/images/duitse_vlag.png'
    },
    {
      name: 'France',
      url: 'https://www.sdeal.fr',
      image: '/images/france.png',
      flag: 'https://www.sdeal.nl/media/images/franse_vlag.png'
    },
    {
      name: 'Belgium',
      url: 'https://www.sdeal.be',
      image: '/images/belgium.png',
      flag: 'https://www.sdeal.nl/media/images/Belgie.png'
    },
    {
      name: 'Italy',
      url: 'https://www.sdeal.it',
      image: '/images/italy.png',
      flag: 'https://www.sdeal.nl/media/images/italian_flag.png'
    },
    {
      name: 'Denmark',
      url: 'https://www.sdeal.dk',
      image: '/images/denmark.png',
      flag: 'https://www.sdeal.nl/media/images/danish_flag.png'
    },
    {
      name: 'Austria',
      url: 'https://www.sdeal.at',
      image: '/images/austria.png',
      flag: 'https://www.sdeal.nl/media/images/austrian_flag.png'
    }
  ];
  res.json(countries);
});

app.get('/api/integrations', (req, res) => {
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
  res.json(integrations);
});

// Serve a simple welcome page for the root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SDeal API Server is running!',
    endpoints: {
      health: '/api/health',
      countries: '/api/countries',
      integrations: '/api/integrations'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`SDeal server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 