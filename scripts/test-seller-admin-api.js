/**
 * Test script for Seller Admin API endpoints
 * Run this script to verify all endpoints are working correctly
 * 
 * Usage: node scripts/test-seller-admin-api.js [baseUrl]
 * Example: node scripts/test-seller-admin-api.js https://your-app.vercel.app
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TEST_SUPPLIER_ID = '1773';
const TEST_ORDER_ID = '68074';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, expectedSuccess = true) {
  try {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`Testing: ${name}`, 'blue');
    log(`URL: ${url}`, 'cyan');
    
    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    
    const data = await response.json();
    
    if (response.ok && data.success === expectedSuccess) {
      log(`✓ SUCCESS (${duration}ms)`, 'green');
      if (data.data) {
        log(`  Response contains data`, 'green');
        if (Array.isArray(data.data)) {
          log(`  Items: ${data.data.length}`, 'green');
        } else if (data.data.items) {
          log(`  Items: ${data.data.items.length}`, 'green');
        }
      }
      return { success: true, data, duration };
    } else {
      log(`✗ FAILED (${response.status})`, 'red');
      log(`  Error: ${data.error || 'Unknown error'}`, 'red');
      if (data.details) {
        log(`  Details: ${data.details}`, 'yellow');
      }
      return { success: false, error: data.error, duration };
    }
  } catch (error) {
    log(`✗ ERROR`, 'red');
    log(`  ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🧪 Seller Admin API Test Suite', 'cyan');
  log(`Base URL: ${BASE_URL}\n`, 'cyan');
  
  const results = [];
  
  // Test 1: Configuration Test
  results.push(await testEndpoint(
    'Configuration Test',
    `${BASE_URL}/api/seller-admin/test?supplierId=${TEST_SUPPLIER_ID}`
  ));
  
  // Test 2: Orders List
  results.push(await testEndpoint(
    'Orders List',
    `${BASE_URL}/api/seller-admin/orders?supplierId=${TEST_SUPPLIER_ID}&page=1&pageSize=5`
  ));
  
  // Test 3: Specific Order
  results.push(await testEndpoint(
    'Order Details',
    `${BASE_URL}/api/seller-admin/order?orderId=${TEST_ORDER_ID}`
  ));
  
  // Test 4: Balance
  results.push(await testEndpoint(
    'Balance Data',
    `${BASE_URL}/api/seller-admin/balance?supplierId=${TEST_SUPPLIER_ID}`
  ));
  
  // Test 5: Delivery Info
  results.push(await testEndpoint(
    'Delivery Info',
    `${BASE_URL}/api/seller-admin/delivery-info?supplierId=${TEST_SUPPLIER_ID}`
  ));
  
  // Summary
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('📊 Test Summary', 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  log(`\nTotal Tests: ${results.length}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Total Duration: ${totalDuration}ms`, 'cyan');
  
  if (failed === 0) {
    log(`\n✅ All tests passed!`, 'green');
    process.exit(0);
  } else {
    log(`\n❌ Some tests failed. Check the errors above.`, 'red');
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  log('Error: fetch is not available. This script requires Node.js 18+ or a fetch polyfill.', 'red');
  process.exit(1);
}

runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});

