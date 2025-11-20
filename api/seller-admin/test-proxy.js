/**
 * Proxy Test Endpoint
 * Tests if the proxy configuration is working correctly
 */

const { makeRequest } = require('./helpers');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  const PROXY_BASE_URL = process.env.PROXY_BASE_URL || '';
  const PROXY_SECRET = process.env.PROXY_SECRET || '';
  const ORIGINAL_API_BASE_URL = process.env.SELLER_ADMIN_API_BASE_URL || 'https://www.sdeal.nl/rest/V1';
  const ADMIN_ACCESS_TOKEN = process.env.SELLER_ADMIN_ACCESS_TOKEN || '';
  const testSupplierId = req.query.supplierId || '1773';

  const testResults = {
    configuration: {
      hasProxyBaseUrl: !!PROXY_BASE_URL,
      proxyBaseUrl: PROXY_BASE_URL || 'Not configured',
      hasProxySecret: !!PROXY_SECRET,
      proxySecretLength: PROXY_SECRET ? PROXY_SECRET.length : 0,
      originalApiBaseUrl: ORIGINAL_API_BASE_URL,
      hasAccessToken: !!ADMIN_ACCESS_TOKEN,
      accessTokenLength: ADMIN_ACCESS_TOKEN ? ADMIN_ACCESS_TOKEN.length : 0
    },
    tests: []
  };

  // Test 1: Check configuration
  if (!PROXY_BASE_URL) {
    testResults.tests.push({
      name: 'Proxy Configuration',
      status: 'failed',
      message: 'PROXY_BASE_URL is not configured',
      recommendation: 'Set PROXY_BASE_URL environment variable in Vercel (e.g., https://caityapps.com/proxy)'
    });
  } else if (!PROXY_SECRET) {
    testResults.tests.push({
      name: 'Proxy Configuration',
      status: 'warning',
      message: 'PROXY_SECRET is not configured',
      recommendation: 'Set PROXY_SECRET environment variable in Vercel for proxy authentication'
    });
  } else {
    testResults.tests.push({
      name: 'Proxy Configuration',
      status: 'success',
      message: 'Proxy configuration is present'
    });
  }

  // Test 2: Try to make a request via proxy
  if (PROXY_BASE_URL && ADMIN_ACCESS_TOKEN) {
    try {
      console.log('[Proxy Test] Making request via proxy...');
      const balanceData = await makeRequest('/sportdeal-balancemanagement/balance/search/', {
        'searchCriteria[filter_groups][0][filters][0][field]': 'supplier_id',
        'searchCriteria[filter_groups][0][filters][0][value]': testSupplierId,
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq'
      });

      testResults.tests.push({
        name: 'Proxy Request Test',
        status: 'success',
        message: 'Successfully connected via proxy',
        details: {
          supplierId: testSupplierId,
          hasData: !!balanceData.items,
          itemCount: balanceData.items ? balanceData.items.length : 0,
          proxyUsed: true
        }
      });
    } catch (error) {
      const errorDetails = {
        supplierId: testSupplierId,
        errorMessage: error.message,
        status: error.status,
        statusText: error.statusText,
        proxyUsed: true
      };

      if (error.details) {
        errorDetails.apiErrorDetails = typeof error.details === 'string' 
          ? error.details.substring(0, 500) 
          : error.details;
      }

      let recommendation = 'Check proxy server configuration and ensure it is running and accessible.';
      
      if (error.status === 403 || error.isCloudflareBlock) {
        recommendation = 'Proxy may still be hitting Cloudflare. Check if proxy server IP is whitelisted in Cloudflare, or if proxy is correctly forwarding requests.';
      } else if (error.status === 401 || error.status === 403) {
        recommendation = 'Check PROXY_SECRET - it may be incorrect or the proxy may require different authentication.';
      }

      testResults.tests.push({
        name: 'Proxy Request Test',
        status: 'failed',
        message: error.message,
        details: errorDetails,
        recommendation: recommendation
      });
    }
  } else {
    testResults.tests.push({
      name: 'Proxy Request Test',
      status: 'skipped',
      message: 'Cannot test proxy - missing configuration',
      details: {
        hasProxyBaseUrl: !!PROXY_BASE_URL,
        hasAccessToken: !!ADMIN_ACCESS_TOKEN
      }
    });
  }

  // Determine overall status
  const allTestsPassed = testResults.tests.every(test => test.status === 'success');
  const hasFailures = testResults.tests.some(test => test.status === 'failed');

  res.status(allTestsPassed ? 200 : (hasFailures ? 500 : 200)).json({
    success: allTestsPassed,
    message: allTestsPassed 
      ? 'Proxy is configured and working correctly!' 
      : hasFailures
        ? 'Proxy test failed. Check the details below.'
        : 'Proxy configuration check completed. Some tests were skipped.',
    results: testResults
  });
};

