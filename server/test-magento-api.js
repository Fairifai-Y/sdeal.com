/**
 * Test script to check Magento API responses
 * Run: node test-magento-api.js
 */

// Load .env from root directory (where PROXY_BASE_URL and PROXY_SECRET are)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { makeRequest: makeMagentoRequest } = require('../api/magento/helpers');

// Debug: Check if proxy is configured
console.log('🔍 Environment check:');
console.log('PROXY_BASE_URL:', process.env.PROXY_BASE_URL ? `${process.env.PROXY_BASE_URL.substring(0, 30)}...` : 'NOT SET');
console.log('PROXY_SECRET:', process.env.PROXY_SECRET ? '***SET***' : 'NOT SET');
console.log('');

async function testMagentoAPI() {
  console.log('🧪 Testing Magento API...\n');
  
  // Test 1: Orders endpoint
  console.log('📦 Test 1: Fetching orders (first page)...');
  try {
    const ordersData = await makeMagentoRequest('/orders', {
      'searchCriteria[pageSize]': 10,
      'searchCriteria[currentPage]': 1
    });
    
    console.log('✅ Orders response received!');
    console.log('Response keys:', Object.keys(ordersData || {}));
    console.log('Total count:', ordersData?.total_count || ordersData?.totalCount || 'N/A');
    console.log('Items count:', ordersData?.items?.length || 0);
    
    if (ordersData?.items && ordersData.items.length > 0) {
      console.log('\n📋 First order structure:');
      const firstOrder = ordersData.items[0];
      console.log('Order keys:', Object.keys(firstOrder));
      console.log('\nFirst order sample (first 1000 chars):');
      console.log(JSON.stringify(firstOrder, null, 2).substring(0, 1000));
      
      // Check for customer email fields
      console.log('\n🔍 Customer email fields in order:');
      const emailFields = Object.keys(firstOrder).filter(k => 
        k.toLowerCase().includes('email') || 
        k.toLowerCase().includes('customer')
      );
      console.log('Email-related fields:', emailFields);
      
      // Show customer email value
      const email = firstOrder.customer_email || 
                   firstOrder.customerEmail || 
                   firstOrder.email ||
                   (firstOrder.billing_address?.email) ||
                   (firstOrder.shipping_address?.email);
      console.log('Customer email found:', email || 'NOT FOUND');
      
      // Show customer name fields
      const nameFields = Object.keys(firstOrder).filter(k => 
        k.toLowerCase().includes('name') || 
        k.toLowerCase().includes('first') || 
        k.toLowerCase().includes('last')
      );
      console.log('Name-related fields:', nameFields);
      
      const firstName = firstOrder.customer_firstname || 
                       firstOrder.first_name || 
                       (firstOrder.billing_address?.firstname);
      const lastName = firstOrder.customer_lastname || 
                      firstOrder.last_name || 
                      (firstOrder.billing_address?.lastname);
      console.log('Customer name:', `${firstName || 'N/A'} ${lastName || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error.message);
    console.error('Error details:', error);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Test 2: Customers endpoint (if available)
  console.log('👥 Test 2: Trying customers endpoint...');
  const customerEndpoints = [
    '/customers/search',
    '/customers',
    '/customers/list'
  ];
  
  for (const endpoint of customerEndpoints) {
    try {
      console.log(`\nTrying: ${endpoint}`);
      const customerData = await makeMagentoRequest(endpoint, {
        'searchCriteria[pageSize]': 5,
        'searchCriteria[currentPage]': 1
      });
      
      console.log(`✅ ${endpoint} - Success!`);
      console.log('Response keys:', Object.keys(customerData || {}));
      console.log('Total count:', customerData?.total_count || customerData?.totalCount || 'N/A');
      console.log('Items count:', customerData?.items?.length || 0);
      
      if (customerData?.items && customerData.items.length > 0) {
        console.log('\nFirst customer sample:');
        console.log(JSON.stringify(customerData.items[0], null, 2).substring(0, 500));
      }
      
      break; // Stop after first successful endpoint
    } catch (error) {
      console.log(`❌ ${endpoint} - Failed:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Testing completed!');
}

// Run test
testMagentoAPI()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

