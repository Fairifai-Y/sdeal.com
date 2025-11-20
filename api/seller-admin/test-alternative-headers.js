/**
 * Alternative header format test endpoint
 * Tests different header formats to find the correct one
 * NOTE: This endpoint now uses the proxy if PROXY_BASE_URL is configured
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
  const ADMIN_ACCESS_TOKEN = process.env.SELLER_ADMIN_ACCESS_TOKEN || '';
  const testSupplierId = req.query.supplierId || '1773';

  if (!ADMIN_ACCESS_TOKEN) {
    return res.status(500).json({
      success: false,
      error: 'Access token not configured'
    });
  }

  // If proxy is configured, use makeRequest which handles proxy automatically
  if (PROXY_BASE_URL) {
    try {
      const balanceData = await makeRequest('/sportdeal-balancemanagement/balance/search/', {
        'searchCriteria[filter_groups][0][filters][0][field]': 'supplier_id',
        'searchCriteria[filter_groups][0][filters][0][value]': testSupplierId,
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq'
      });

      return res.json({
        success: true,
        message: 'Proxy is configured and working! Request succeeded via proxy.',
        results: [{
          name: 'Proxy Request',
          status: 'success',
          statusCode: 200,
          message: 'Successfully connected via proxy',
          details: {
            proxyUrl: PROXY_BASE_URL,
            hasData: !!balanceData.items,
            itemCount: balanceData.items ? balanceData.items.length : 0
          }
        }],
        recommendation: 'Proxy is working correctly. All API requests will now go through the proxy.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Proxy is configured but request failed',
        results: [{
          name: 'Proxy Request',
          status: 'failed',
          statusCode: error.status || 500,
          statusText: error.statusText || 'Unknown error',
          error: error.message,
          details: error.details
        }],
        recommendation: 'Check proxy configuration and ensure PROXY_SECRET is correct'
      });
    }
  }

  // If no proxy, test different header formats (original behavior)
  const SELLER_ADMIN_API_BASE_URL = process.env.SELLER_ADMIN_API_BASE_URL || 'https://www.sdeal.nl/rest/V1';
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

      // Check if this is a Cloudflare block (check full response, not truncated)
      const isCloudflareBlock = !response.ok && (
        (typeof responseData === 'string' && (
          responseData.includes('Cloudflare') ||
          responseData.includes('cf-error-details') ||
          responseData.includes('Sorry, you have been blocked') ||
          responseData.includes('Attention Required') ||
          responseData.includes('cf-wrapper')
        )) ||
        (response.status === 403 && typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>'))
      );

      results.push({
        name: variation.name,
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        statusText: response.statusText,
        isCloudflareBlock: isCloudflareBlock,
        headers: Object.keys(variation.headers).reduce((acc, key) => {
          if (key === 'Authorization') {
            acc[key] = `${variation.headers[key].substring(0, 10)}...`;
          } else {
            acc[key] = variation.headers[key];
          }
          return acc;
        }, {}),
        response: response.ok 
          ? (responseData.items ? `Success: ${responseData.items.length} items` : 'Success') 
          : `Error: ${typeof responseData === 'string' ? responseData.substring(0, 200) : JSON.stringify(responseData).substring(0, 200)}`
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
  
  // Check if all failed requests are Cloudflare blocks
  // Use the isCloudflareBlock flag we set during testing, or check response
  const allCloudflareBlocks = results.length > 0 && results.every(r => {
    if (r.status === 'success') return true; // Success is not a block
    // Use the flag we set, or check the response
    if (r.isCloudflareBlock === true) return true;
    const response = r.response || '';
    const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
    return responseStr.includes('Cloudflare') || 
           responseStr.includes('cf-error-details') || 
           responseStr.includes('Sorry, you have been blocked') ||
           responseStr.includes('Attention Required') ||
           (r.statusCode === 403 && responseStr.includes('<!DOCTYPE html>'));
  });

  let message = successful 
    ? `Found working format: ${successful.name}` 
    : 'None of the header formats worked.';
  
  let recommendation = successful 
    ? `Use this header format: ${JSON.stringify(successful.headers, null, 2)}`
    : 'Please verify the access token is correct and has the right permissions';

  if (allCloudflareBlocks) {
    message = 'All requests are being blocked by Cloudflare. This is not an authentication issue.';
    recommendation = `Cloudflare is blocking all requests from Vercel serverless functions. 

SOLUTION: Configure a proxy server to bypass Cloudflare blocking.

1. Set PROXY_BASE_URL environment variable (e.g., https://caityapps.com/proxy)
2. Set PROXY_SECRET environment variable (your proxy authentication secret)
3. The proxy server should forward requests to sdeal.nl/rest/V1

Alternative solutions:
- Whitelist Vercel IP addresses in Cloudflare (Security → WAF → IP Access Rules)
- Adjust Cloudflare Bot Protection settings to allow API requests from serverless functions
- Create an exception for /rest/V1/* endpoints in Cloudflare

Note: The x-vercel-id header in requests identifies them as coming from Vercel, which Cloudflare may be using to block them.`;
  }

  res.json({
    success: !!successful,
    message: message,
    results: results,
    recommendation: recommendation,
    isCloudflareBlock: allCloudflareBlocks,
    nextSteps: allCloudflareBlocks ? [
      'Configure PROXY_BASE_URL and PROXY_SECRET in Vercel environment variables',
      'Or contact the API administrator (sdeal.nl) to whitelist Vercel IP addresses',
      'Or ask them to adjust Cloudflare bot protection settings',
      'The proxy server should forward requests to sdeal.nl/rest/V1'
    ] : []
  });
};

