require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { makeRequest: makeSellerAdminRequest } = require('../api/seller-admin/helpers');

async function testSupplierReviewEndpoint() {
  const supplierId = 1939;
  console.log('🔍 Testing supplier review endpoint...\n');
  console.log(`Endpoint: /supplier/review (with supplierId=${supplierId})\n`);

  try {
    // Test 1: With supplierId as query parameter
    console.log('📤 Test 1: Sending GET request with supplierId as query parameter...');
    const response1 = await makeSellerAdminRequest('/supplier/review', {
      supplierId: supplierId
    });
    
    console.log('\n✅ Response 1 received:');
    console.log('Response type:', typeof response1);
    console.log('Is array:', Array.isArray(response1));
    
    if (Array.isArray(response1)) {
      console.log(`\n📊 Array with ${response1.length} items`);
      if (response1.length > 0) {
        console.log('\n📄 First item structure:');
        console.log(JSON.stringify(response1[0], null, 2));
        
        if (response1.length > 1) {
          console.log(`\n... and ${response1.length - 1} more item(s)`);
          if (response1.length <= 5) {
            console.log('\n📄 All items:');
            response1.forEach((item, index) => {
              console.log(`\n--- Item ${index + 1} ---`);
              console.log(JSON.stringify(item, null, 2));
            });
          }
        }
      }
    } else if (response1 && typeof response1 === 'object') {
      console.log('\n📄 Response structure:');
      console.log(JSON.stringify(response1, null, 2));
    } else {
      console.log('\n📄 Raw response:');
      console.log(response1);
    }

    // Test 2: With supplierId in path
    console.log('\n\n📤 Test 2: Testing with supplierId in path...');
    try {
      const response2 = await makeSellerAdminRequest(`/supplier/review/${supplierId}`, {});
      console.log('\n✅ Response 2 received:');
      if (Array.isArray(response2)) {
        console.log(`Array with ${response2.length} items`);
        if (response2.length > 0) {
          console.log('\n📄 First item:');
          console.log(JSON.stringify(response2[0], null, 2));
        }
      } else {
        console.log(JSON.stringify(response2, null, 2));
      }
    } catch (pathError) {
      console.log('❌ Path-based request failed:', pathError.message);
    }

    // Test 3: With searchCriteria
    console.log('\n\n📤 Test 3: Testing with searchCriteria...');
    try {
      const response3 = await makeSellerAdminRequest('/supplier/review', {
        supplierId: supplierId,
        'searchCriteria[pageSize]': 10,
        'searchCriteria[currentPage]': 1
      });
      
      console.log('\n✅ Response 3 received:');
      if (Array.isArray(response3)) {
        console.log(`Array with ${response3.length} items`);
      } else if (response3 && typeof response3 === 'object') {
        console.log('Response structure:');
        console.log(JSON.stringify(response3, null, 2));
      } else {
        console.log(response3);
      }
    } catch (searchError) {
      console.log('❌ SearchCriteria request failed:', searchError.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Error details:', error);
    
    if (error.details) {
      console.error('\nError details:', error.details);
    }
  }
}

testSupplierReviewEndpoint()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

