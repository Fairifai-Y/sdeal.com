/**
 * Test script to inspect order structure from Magento API
 * Run: node test-order-structure.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { makeRequest: makeMagentoRequest } = require('../api/magento/helpers');

async function testOrderStructure() {
  try {
    console.log('🔍 Fetching orders to inspect structure...\n');
    
    const ordersData = await makeMagentoRequest('/orders', {
      'searchCriteria[pageSize]': 5,
      'searchCriteria[currentPage]': 1
    });
    
    const orders = ordersData?.items || [];
    
    if (orders.length === 0) {
      console.log('❌ No orders found');
      return;
    }
    
    console.log(`✅ Found ${orders.length} orders\n`);
    console.log('='.repeat(80));
    console.log('📦 ORDER STRUCTURE ANALYSIS');
    console.log('='.repeat(80));
    
    orders.forEach((order, index) => {
      console.log(`\n📋 Order ${index + 1} (entity_id: ${order.entity_id || order.id}):`);
      console.log('-'.repeat(80));
      
      // Check all possible store-related fields
      console.log('Store-related fields:');
      if (order.store_id !== undefined) console.log(`  store_id: ${order.store_id} (type: ${typeof order.store_id})`);
      if (order.storeId !== undefined) console.log(`  storeId: ${order.storeId} (type: ${typeof order.storeId})`);
      if (order.store_code !== undefined) console.log(`  store_code: ${order.store_code}`);
      if (order.storeCode !== undefined) console.log(`  storeCode: ${order.storeCode}`);
      if (order.store_name !== undefined) console.log(`  store_name: ${order.store_name}`);
      if (order.storeName !== undefined) console.log(`  storeName: ${order.storeName}`);
      
      // Check country fields
      console.log('\nCountry-related fields:');
      if (order.shipping_countryid !== undefined) console.log(`  shipping_countryid: ${order.shipping_countryid}`);
      if (order.country_id !== undefined) console.log(`  country_id: ${order.country_id}`);
      if (order.shipping_country !== undefined) console.log(`  shipping_country: ${order.shipping_country}`);
      if (order.billing_address?.country_id) console.log(`  billing_address.country_id: ${order.billing_address.country_id}`);
      if (order.shipping_address?.country_id) console.log(`  shipping_address.country_id: ${order.shipping_address.country_id}`);
      
      // Show full order keys for first order
      if (index === 0) {
        console.log('\n📝 All order keys (first order):');
        const keys = Object.keys(order).sort();
        keys.forEach(key => {
          const value = order[key];
          const type = typeof value;
          const preview = type === 'object' && value !== null ? JSON.stringify(value).substring(0, 100) : String(value).substring(0, 100);
          console.log(`  ${key}: ${type} = ${preview}${preview.length >= 100 ? '...' : ''}`);
        });
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS:');
    console.log('='.repeat(80));
    
    // Analyze store_id and store_name combinations
    const storeInfo = orders.map(o => ({
      store_id: o.store_id || o.storeId || null,
      store_name: o.store_name || null,
      country: o.billing_address?.country_id || o.shipping_address?.country_id || null
    }));
    
    console.log('\n📊 Store ID vs Store Name Analysis:');
    storeInfo.forEach((info, idx) => {
      console.log(`  Order ${idx + 1}: store_id=${info.store_id || 'MISSING'}, store_name="${info.store_name || 'MISSING'}", country=${info.country || 'MISSING'}`);
    });
    
    // Group by store_id and store_name
    const storeMapping = {};
    storeInfo.forEach(info => {
      if (info.store_id !== null) {
        if (!storeMapping[info.store_id]) {
          storeMapping[info.store_id] = { names: new Set(), countries: new Set() };
        }
        if (info.store_name) storeMapping[info.store_id].names.add(info.store_name);
        if (info.country) storeMapping[info.store_id].countries.add(info.country);
      }
    });
    
    console.log('\n🔍 Store ID Mapping Analysis:');
    Object.keys(storeMapping).sort().forEach(storeId => {
      const info = storeMapping[storeId];
      console.log(`  store_id ${storeId}: store_names=[${Array.from(info.names).join(', ')}], countries=[${Array.from(info.countries).join(', ')}]`);
    });
    
    console.log(`\nCurrent mapping: 1=NL, 2=DE, 3=BE, 4=FR`);
    console.log('\n💡 Recommendation: Use store_name as fallback when store_id is missing');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testOrderStructure();

