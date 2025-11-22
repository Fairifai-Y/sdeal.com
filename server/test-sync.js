/**
 * Local test script for sync customers
 * Run: node test-sync.js
 */

require('dotenv').config();
const path = require('path');

// Set up environment to match Vercel API structure
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Import sync function
const syncCustomersHandler = require('../api/admin/mailing/sync-customers');

// Create mock request/response
const mockReq = {
  method: 'POST',
  body: {
    batchSize: 100,
    maxPages: null,
    delayBetweenBatches: 1000,
    storeMapping: {},
    testMode: true // Test mode: max 100 orders (1 page)
  },
  query: {}
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`\n[Response ${code}]:`, JSON.stringify(data, null, 2));
      return mockRes;
    },
    end: () => {
      console.log(`\n[Response ${code}]: (no body)`);
      return mockRes;
    }
  }),
  json: (data) => {
    console.log('\n[Response]:', JSON.stringify(data, null, 2));
    return mockRes;
  },
  setHeader: (name, value) => {
    // Ignore headers in console
  },
  end: () => {
    console.log('\n[Response]: (ended)');
  }
};

// Run sync
console.log('🚀 Starting local sync test...');
console.log('📋 Test mode: true (max 100 orders)');
console.log('⏳ This may take a few minutes...\n');

syncCustomersHandler(mockReq, mockRes)
  .then(() => {
    console.log('\n✅ Sync test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync test failed:', error);
    process.exit(1);
  });

