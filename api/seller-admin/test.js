/**
 * Seller Admin API - Test/Health Check Endpoint
 * Tests if the API configuration is correct and can connect to the external API
 */

const { makeRequest, getAuthHeaders, SELLER_ADMIN_API_BASE_URL } = require('./helpers');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const testResults = {
      configuration: {
        baseUrl: SELLER_ADMIN_API_BASE_URL,
        hasAccessToken: !!process.env.SELLER_ADMIN_ACCESS_TOKEN,
        accessTokenLength: process.env.SELLER_ADMIN_ACCESS_TOKEN ? process.env.SELLER_ADMIN_ACCESS_TOKEN.length : 0
      },
      tests: []
    };

    // Test 1: Check if headers can be generated
    try {
      const headers = getAuthHeaders();
      testResults.tests.push({
        name: 'Authentication Headers',
        status: 'success',
        message: 'Headers generated successfully',
        details: {
          hasAuthorization: !!headers.Authorization,
          hasTokenType: headers['Token-Type'] === 'admin',
          tokenType: headers['Token-Type']
        }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Authentication Headers',
        status: 'failed',
        message: error.message
      });
    }

    // Test 2: Try a simple API request (balance endpoint with a test supplier ID)
    const testSupplierId = req.query.supplierId || '1773';
    
    try {
      const balanceData = await makeRequest('/sportdeal-balancemanagement/balance/search/', {
        'searchCriteria[filter_groups][0][filters][0][field]': 'supplier_id',
        'searchCriteria[filter_groups][0][filters][0][value]': testSupplierId,
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq'
      });

      testResults.tests.push({
        name: 'API Connection Test (Balance Endpoint)',
        status: 'success',
        message: 'Successfully connected to Seller Admin API',
        details: {
          supplierId: testSupplierId,
          hasData: !!balanceData.items,
          itemCount: balanceData.items ? balanceData.items.length : 0
        }
      });
    } catch (error) {
      // Get more details about the error
      const errorDetails = {
        supplierId: testSupplierId,
        errorMessage: error.message,
        status: error.status,
        statusText: error.statusText
      };

      // Add error details if available
      if (error.details) {
        errorDetails.apiErrorDetails = error.details;
      }

      // Add troubleshooting info based on status code
      let troubleshooting = {
        suggestion: 'Check if the access token is valid and has the correct permissions',
        possibleCauses: []
      };

      if (error.status === 403) {
        troubleshooting.suggestion = '403 Forbidden: The access token might be invalid, expired, or lacks permissions';
        troubleshooting.possibleCauses = [
          'Access token is invalid or expired',
          'Access token does not have permission for this endpoint',
          'Token-Type header might need to be different (case-sensitive?)',
          'Authorization header format might be incorrect',
          'The token might need to be prefixed with "Bearer " or another format'
        ];
      } else if (error.status === 401) {
        troubleshooting.suggestion = '401 Unauthorized: Authentication failed';
        troubleshooting.possibleCauses = [
          'Access token is missing or incorrect',
          'Authorization header format is wrong',
          'Token-Type header is missing or incorrect'
        ];
      }

      testResults.tests.push({
        name: 'API Connection Test (Balance Endpoint)',
        status: 'failed',
        message: error.message,
        details: errorDetails,
        troubleshooting: troubleshooting
      });
    }

    // Determine overall status
    const allTestsPassed = testResults.tests.every(test => test.status === 'success');
    
    res.status(allTestsPassed ? 200 : 500).json({
      success: allTestsPassed,
      message: allTestsPassed 
        ? 'All tests passed! API is configured correctly.' 
        : 'Some tests failed. Check the details below.',
      results: testResults
    });

  } catch (error) {
    console.error('Error running tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run tests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

