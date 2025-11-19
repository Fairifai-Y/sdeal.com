/**
 * Test multiple endpoints to see if Cloudflare blocks specific paths
 * This helps identify if the problem is endpoint-specific or IP-based
 */

const { makeRequest, getAuthHeaders } = require('./helpers');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  const testSupplierId = req.query.supplierId || '1773';
  const testOrderId = req.query.orderId || '68074';

  const endpoints = [
    {
      name: 'Orders List (supplier/orders/)',
      endpoint: '/supplier/orders/',
      queryParams: {
        'searchCriteria[filter_groups][0][filters][0][field]': 'supplier_id',
        'searchCriteria[filter_groups][0][filters][0][value]': testSupplierId,
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq',
        'searchCriteria[currentPage]': '1',
        'searchCriteria[pageSize]': '5'
      }
    },
    {
      name: 'Balance (sportdeal-balancemanagement/balance/search/)',
      endpoint: '/sportdeal-balancemanagement/balance/search/',
      queryParams: {
        'searchCriteria[filter_groups][0][filters][0][field]': 'supplier_id',
        'searchCriteria[filter_groups][0][filters][0][value]': testSupplierId,
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq'
      }
    },
    {
      name: 'Delivery Info (sportdeal-delivery/info/)',
      endpoint: '/sportdeal-delivery/info/',
      queryParams: {
        supplierId: testSupplierId
      }
    },
    {
      name: 'Order Details (supplier/order/{id})',
      endpoint: `/supplier/order/${testOrderId}`,
      queryParams: {}
    }
  ];

  const results = [];

  for (const endpointConfig of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpointConfig.name}`);
      
      const data = await makeRequest(endpointConfig.endpoint, endpointConfig.queryParams);

      results.push({
        name: endpointConfig.name,
        endpoint: endpointConfig.endpoint,
        status: 'success',
        message: 'Endpoint is accessible',
        hasData: !!data,
        dataType: Array.isArray(data) ? 'array' : typeof data
      });
    } catch (error) {
      const isCloudflareBlock = error.isCloudflareBlock || 
        (error.details && typeof error.details === 'string' && (
          error.details.includes('Cloudflare') ||
          error.details.includes('cf-error-details') ||
          error.details.includes('Sorry, you have been blocked')
        ));

      results.push({
        name: endpointConfig.name,
        endpoint: endpointConfig.endpoint,
        status: 'failed',
        statusCode: error.status,
        statusText: error.statusText,
        isCloudflareBlock: isCloudflareBlock,
        message: error.message,
        error: isCloudflareBlock 
          ? 'Blocked by Cloudflare' 
          : error.message
      });
    }
  }

  const successful = results.filter(r => r.status === 'success');
  const allCloudflareBlocks = results.every(r => 
    r.status === 'success' || r.isCloudflareBlock === true
  );
  const someWork = successful.length > 0;

  let conclusion = '';
  if (allCloudflareBlocks && !someWork) {
    conclusion = 'All endpoints are blocked by Cloudflare. This is an IP-based block, not endpoint-specific.';
  } else if (someWork) {
    conclusion = `Some endpoints work (${successful.length}/${results.length}). The problem may be endpoint-specific or path-based blocking.`;
  } else {
    conclusion = 'All endpoints failed, but not all are Cloudflare blocks. Check authentication and endpoint paths.';
  }

  res.json({
    success: someWork,
    message: conclusion,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: results.length - successful.length,
      allCloudflareBlocks: allCloudflareBlocks
    },
    results: results,
    recommendation: allCloudflareBlocks && !someWork
      ? 'Whitelist Vercel IP addresses in Cloudflare. This is not an endpoint-specific issue.'
      : someWork
      ? 'Some endpoints work. Check Cloudflare rules for specific path blocking.'
      : 'Check authentication and endpoint configurations.'
  });
};

