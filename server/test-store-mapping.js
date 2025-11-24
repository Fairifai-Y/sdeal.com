/**
 * Test script to verify store mapping is working correctly
 * Run: node test-store-mapping.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { makeRequest: makeMagentoRequest } = require('../api/magento/helpers');

// Store mapping
const storeMapping = {
  1: 'NL',
  2: 'DE',
  3: 'BE',
  4: 'FR'
};

function convertOrderToConsumer(order) {
  // Determine store from order
  // First try store_name (most reliable, directly from Magento)
  let store = null;
  if (order.store_name) {
    // Normalize store_name (remove newlines, take first line, trim)
    const normalizedStoreName = order.store_name.split('\n')[0].trim().toUpperCase();
    // Map common store names
    if (normalizedStoreName === 'NL' || normalizedStoreName === 'NETHERLANDS') {
      store = 'NL';
    } else if (normalizedStoreName === 'DE' || normalizedStoreName === 'GERMANY') {
      store = 'DE';
    } else if (normalizedStoreName === 'BE' || normalizedStoreName === 'BELGIUM') {
      store = 'BE';
    } else if (normalizedStoreName === 'FR' || normalizedStoreName === 'FRANCE') {
      store = 'FR';
    } else if (normalizedStoreName === 'EN' || normalizedStoreName === 'ENGLISH' || normalizedStoreName === 'UK') {
      // EN store might map to NL or UK - defaulting to NL for now
      store = 'NL';
    }
  }
  
  // If no store from store_name, try store_id mapping
  if (!store) {
    const storeId = order.store_id || order.storeId;
    store = storeId ? (storeMapping[storeId] || null) : null;
  }
  
  // Final fallback: use country from billing/shipping address
  if (!store) {
    const countryId = order.billing_address?.country_id || 
                      order.shipping_address?.country_id ||
                      order.shipping_countryid || 
                      order.country_id;
    if (countryId) {
      const countryUpper = String(countryId).toUpperCase();
      if (['NL', 'NETHERLANDS'].includes(countryUpper)) store = 'NL';
      else if (['DE', 'GERMANY'].includes(countryUpper)) store = 'DE';
      else if (['BE', 'BELGIUM'].includes(countryUpper)) store = 'BE';
      else if (['FR', 'FRANCE'].includes(countryUpper)) store = 'FR';
    }
  }
  
  // Ultimate fallback
  store = store || 'NL';
  
  const country = order.billing_address?.country_id || 
                  order.shipping_address?.country_id ||
                  order.shipping_countryid || 
                  order.country_id || 
                  order.shipping_country || 
                  store;
  
  return {
    email: order.customer_email || order.customerEmail || order.email || (order.billing_address?.email) || (order.shipping_address?.email),
    store,
    country
  };
}

async function testStoreMapping() {
  try {
    console.log('🔍 Testing store mapping with orders...\n');
    
    const ordersData = await makeMagentoRequest('/orders', {
      'searchCriteria[pageSize]': 20,
      'searchCriteria[currentPage]': 1
    });
    
    const orders = ordersData?.items || [];
    
    if (orders.length === 0) {
      console.log('❌ No orders found');
      return;
    }
    
    console.log(`✅ Found ${orders.length} orders\n`);
    console.log('='.repeat(100));
    console.log('📊 STORE MAPPING TEST RESULTS');
    console.log('='.repeat(100));
    
    const storeCounts = {};
    const countryCounts = {};
    
    orders.forEach((order, index) => {
      const consumer = convertOrderToConsumer(order);
      
      // Count stores
      storeCounts[consumer.store] = (storeCounts[consumer.store] || 0) + 1;
      countryCounts[consumer.country] = (countryCounts[consumer.country] || 0) + 1;
      
      const normalizedStoreName = order.store_name ? order.store_name.split('\n')[0].trim().toUpperCase() : null;
      console.log(`\n📋 Order ${index + 1} (entity_id: ${order.entity_id}):`);
      console.log(`  store_id: ${order.store_id || 'MISSING'}`);
      console.log(`  store_name (raw): "${order.store_name || 'MISSING'}"`);
      console.log(`  store_name (normalized): "${normalizedStoreName || 'MISSING'}"`);
      console.log(`  billing_address.country_id: ${order.billing_address?.country_id || 'MISSING'}`);
      console.log(`  → Mapped store: ${consumer.store}`);
      console.log(`  → Mapped country: ${consumer.country}`);
    });
    
    console.log('\n' + '='.repeat(100));
    console.log('📈 SUMMARY');
    console.log('='.repeat(100));
    console.log('\nStore distribution:');
    Object.keys(storeCounts).sort().forEach(store => {
      console.log(`  ${store}: ${storeCounts[store]} orders`);
    });
    console.log('\nCountry distribution:');
    Object.keys(countryCounts).sort().forEach(country => {
      console.log(`  ${country}: ${countryCounts[country]} orders`);
    });
    
    // Check if all stores are NL
    const uniqueStores = Object.keys(storeCounts);
    if (uniqueStores.length === 1 && uniqueStores[0] === 'NL') {
      console.log('\n⚠️  WARNING: All orders mapped to NL! This might indicate a mapping issue.');
    } else {
      console.log(`\n✅ Good: Found ${uniqueStores.length} different stores: ${uniqueStores.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testStoreMapping();

