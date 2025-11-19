/**
 * Alternative header format test endpoint
 * Tests different header formats to find the correct one
 */

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  const SELLER_ADMIN_API_BASE_URL = process.env.SELLER_ADMIN_API_BASE_URL || 'https://www.sportdeal.nl/rest/V1';
  const ADMIN_ACCESS_TOKEN = process.env.SELLER_ADMIN_ACCESS_TOKEN || '';
  const testSupplierId = req.query.supplierId || '1773';

  if (!ADMIN_ACCESS_TOKEN) {
    return res.status(500).json({
      success: false,
      error: 'Access token not configured'
    });
  }

  const testUrl = `${SELLER_ADMIN_API_BASE_URL}/sportdeal-balancemanagement/balance/search/?searchCriteria[filter_groups][0][filters][0][field]=supplier_id&searchCriteria[filter_groups][0][filters][0][value]=${testSupplierId}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;

  // Different header format variations to try
  const headerVariations = [
    {
      name: 'Current format (Authorization + Token-Type)',
      headers: {
        'Authorization': ADMIN_ACCESS_TOKEN,
        'Token-Type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Lowercase token-type',
      headers: {
        'Authorization': ADMIN_ACCESS_TOKEN,
        'token-type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Bearer token format',
      headers: {
        'Authorization': `Bearer ${ADMIN_ACCESS_TOKEN}`,
        'Token-Type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Only Authorization header',
      headers: {
        'Authorization': ADMIN_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'X-Auth-Token format',
      headers: {
        'X-Auth-Token': ADMIN_ACCESS_TOKEN,
        'Token-Type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Custom header name',
      headers: {
        'Authorization': ADMIN_ACCESS_TOKEN,
        'X-Token-Type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  ];

  const results = [];

  for (const variation of headerVariations) {
    try {
      console.log(`Testing: ${variation.name}`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: variation.headers
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      results.push({
        name: variation.name,
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.keys(variation.headers).reduce((acc, key) => {
          if (key === 'Authorization') {
            acc[key] = `${variation.headers[key].substring(0, 10)}...`;
          } else {
            acc[key] = variation.headers[key];
          }
          return acc;
        }, {}),
        response: response.ok ? (responseData.items ? `Success: ${responseData.items.length} items` : 'Success') : `Error: ${typeof responseData === 'string' ? responseData.substring(0, 200) : JSON.stringify(responseData).substring(0, 200)}`
      });

      // If successful, we found the right format
      if (response.ok) {
        break;
      }
    } catch (error) {
      results.push({
        name: variation.name,
        status: 'error',
        error: error.message
      });
    }
  }

  const successful = results.find(r => r.status === 'success');

  res.json({
    success: !!successful,
    message: successful 
      ? `Found working format: ${successful.name}` 
      : 'None of the header formats worked. Check the access token validity.',
    results: results,
    recommendation: successful 
      ? `Use this header format: ${JSON.stringify(successful.headers, null, 2)}`
      : 'Please verify the access token is correct and has the right permissions'
  });
};

