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
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  const headerVariations = [
    {
      name: 'Current format + Browser headers',
      headers: {
        'Authorization': ADMIN_ACCESS_TOKEN,
        'Token-Type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...browserHeaders
      }
    },
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
      name: 'Lowercase token-type + Browser headers',
      headers: {
        'Authorization': ADMIN_ACCESS_TOKEN,
        'token-type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...browserHeaders
      }
    },
    {
      name: 'Bearer token format + Browser headers',
      headers: {
        'Authorization': `Bearer ${ADMIN_ACCESS_TOKEN}`,
        'Token-Type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...browserHeaders
      }
    },
    {
      name: 'Only Authorization + Browser headers',
      headers: {
        'Authorization': ADMIN_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...browserHeaders
      }
    },
    {
      name: 'X-Auth-Token format + Browser headers',
      headers: {
        'X-Auth-Token': ADMIN_ACCESS_TOKEN,
        'Token-Type': 'admin',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...browserHeaders
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
  const allCloudflareBlocks = results.every(r => 
    r.response && typeof r.response === 'string' && r.response.includes('Cloudflare')
  );

  let message = successful 
    ? `Found working format: ${successful.name}` 
    : 'None of the header formats worked.';
  
  let recommendation = successful 
    ? `Use this header format: ${JSON.stringify(successful.headers, null, 2)}`
    : 'Please verify the access token is correct and has the right permissions';

  if (allCloudflareBlocks) {
    message = 'All requests are being blocked by Cloudflare. This is not an authentication issue.';
    recommendation = `Cloudflare is blocking all requests from Vercel serverless functions. The API administrator needs to:
1. Whitelist Vercel IP addresses in Cloudflare (Security → WAF → IP Access Rules)
2. Adjust Cloudflare Bot Protection settings to allow API requests from serverless functions
3. Or create an exception for /rest/V1/* endpoints in Cloudflare

See CLOUDFLARE_BLOCK_SOLUTION.md for detailed instructions.

Note: The x-vercel-id header in requests identifies them as coming from Vercel, which Cloudflare may be using to block them.`;
  }

  res.json({
    success: !!successful,
    message: message,
    results: results,
    recommendation: recommendation,
    isCloudflareBlock: allCloudflareBlocks,
    nextSteps: allCloudflareBlocks ? [
      'Contact the API administrator (sportdeal.nl)',
      'Request whitelisting of Vercel IP addresses in Cloudflare',
      'Or ask them to adjust Cloudflare bot protection settings',
      'Alternative: Use a proxy server or API gateway that is already whitelisted'
    ] : []
  });
};

