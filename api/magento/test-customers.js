const { makeRequest } = require('./helpers');

/**
 * Test endpoint to check Magento customers API
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const results = {
    success: false,
    endpoints: [],
    errors: []
  };

  // Try different possible endpoints
  const endpointsToTry = [
    '/customers/search',
    '/customers',
    '/customers/list',
    '/customers/search?searchCriteria[pageSize]=1&searchCriteria[currentPage]=1'
  ];

  for (const endpoint of endpointsToTry) {
    try {
      console.log(`[Test Customers] Trying endpoint: ${endpoint}`);
      
      let queryParams = {};
      let cleanEndpoint = endpoint;
      
      // Extract query params if in endpoint string
      if (endpoint.includes('?')) {
        const [path, query] = endpoint.split('?');
        cleanEndpoint = path;
        const params = new URLSearchParams(query);
        params.forEach((value, key) => {
          queryParams[key] = value;
        });
      } else {
        // Add default params for search endpoints
        if (endpoint.includes('search')) {
          queryParams = {
            'searchCriteria[pageSize]': 1,
            'searchCriteria[currentPage]': 1
          };
        }
      }

      const data = await makeRequest(cleanEndpoint, queryParams);
      
      results.endpoints.push({
        endpoint: cleanEndpoint,
        queryParams,
        success: true,
        responseKeys: Object.keys(data || {}),
        responseSample: JSON.stringify(data, null, 2).substring(0, 500),
        hasItems: !!(data?.items || data?.data),
        itemCount: (data?.items || data?.data || []).length,
        totalCount: data?.total_count || data?.totalCount || null
      });
      
      console.log(`[Test Customers] Success for ${endpoint}:`, {
        keys: Object.keys(data || {}),
        hasItems: !!(data?.items || data?.data),
        itemCount: (data?.items || data?.data || []).length
      });
      
    } catch (error) {
      console.error(`[Test Customers] Error for ${endpoint}:`, error.message);
      results.endpoints.push({
        endpoint,
        success: false,
        error: error.message,
        errorDetails: error.details || null
      });
      results.errors.push({
        endpoint,
        error: error.message
      });
    }
  }

  // Check if any endpoint worked
  const successfulEndpoints = results.endpoints.filter(e => e.success);
  results.success = successfulEndpoints.length > 0;

  return res.json(results);
};

