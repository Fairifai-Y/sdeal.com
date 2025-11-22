/**
 * Helper functions for Magento API integration
 * Handles HTTP requests to Magento REST API via proxy (if configured)
 * 
 * IMPORTANT: Magento REST API does NOT use admin token headers
 * Only the Seller Admin API (sdeal.nl/rest/V1) uses admin tokens
 */

// Import zlib for gzip decompression
const zlib = require('zlib');
const { promisify } = require('util');
const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);

// Proxy configuration
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || '';
const PROXY_SECRET = process.env.PROXY_SECRET || '';

// Magento API base URL (the target that the proxy will forward to)
const MAGENTO_API_BASE_URL = (process.env.MAGENTO_API_BASE_URL || 'https://www.sdeal.nl/rest/V1').replace(/\/$/, '');

// Bearer token for Magento API
// Use MAGENTO_BEARER_TOKEN if set, otherwise fallback to SELLER_ADMIN_ACCESS_TOKEN
const MAGENTO_BEARER_TOKEN = process.env.MAGENTO_BEARER_TOKEN || process.env.SELLER_ADMIN_ACCESS_TOKEN || '';

/**
 * Decompress response if it's gzipped or deflated
 * @param {ArrayBuffer} buffer - Response buffer
 * @param {string} contentEncoding - Content-Encoding header value
 * @returns {Promise<string>} Decompressed text
 */
async function decompressResponse(buffer, contentEncoding) {
  // Check if response starts with gzip magic number (0x1f 0x8b)
  const uint8Array = new Uint8Array(buffer);
  const isGzipped = uint8Array.length >= 2 && uint8Array[0] === 0x1f && uint8Array[1] === 0x8b;
  
  if (contentEncoding === 'gzip' || isGzipped) {
    try {
      const decompressed = await gunzip(Buffer.from(buffer));
      return decompressed.toString('utf-8');
    } catch (error) {
      console.warn('[Magento API] Failed to decompress gzip, trying as plain text:', error.message);
      // Fallback to plain text
      return Buffer.from(buffer).toString('utf-8');
    }
  } else if (contentEncoding === 'deflate') {
    try {
      const decompressed = await inflate(Buffer.from(buffer));
      return decompressed.toString('utf-8');
    } catch (error) {
      console.warn('[Magento API] Failed to decompress deflate, trying as plain text:', error.message);
      return Buffer.from(buffer).toString('utf-8');
    }
  } else {
    // No compression, return as text
    return Buffer.from(buffer).toString('utf-8');
  }
}

/**
 * Make a proxy request to Magento API
 * @param {string} targetUrl - Full target URL (Magento API endpoint)
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {Object} headers - Headers to send (will be forwarded by proxy)
 * @param {string} body - Request body (for POST, PUT, PATCH, DELETE)
 * @returns {Promise<Response>} Fetch Response object
 */
async function makeProxyRequest(targetUrl, method = 'GET', headers = {}, body = null) {
  let proxyBaseUrl = PROXY_BASE_URL || 'https://caityapps.com/proxy';
  const proxySecret = PROXY_SECRET || '';
  
  // Ensure proxy URL has proper protocol and no trailing slash
  if (!proxyBaseUrl.startsWith('http://') && !proxyBaseUrl.startsWith('https://')) {
    proxyBaseUrl = `https://${proxyBaseUrl}`;
  }
  const proxyUrl = proxyBaseUrl.replace(/\/$/, '');
  
  console.log(`[Magento API] Routing ${method} ${targetUrl} through ${proxyUrl}`);
  console.log(`[Magento API] Proxy base URL: ${proxyBaseUrl}`);
  console.log(`[Magento API] Proxy secret configured: ${proxySecret ? 'Yes (***)' : 'No'}`);
  
  // Proxy expects:
  // 1. Secret in header: X-Proxy-Secret
  // 2. URL as query parameter: ?url=...
  // 3. Method via HTTP method (GET, POST, etc.)
  // 4. Body in request body (for POST, PUT, PATCH, DELETE)
  // 5. Headers in request headers (except Host and X-Proxy-Secret)
  
  const proxyUrlWithParams = `${proxyUrl}?url=${encodeURIComponent(targetUrl)}`;
  
  // Build headers to forward (exclude Host and X-Proxy-Secret)
  const forwardHeaders = {
    'X-Proxy-Secret': proxySecret,
  };
  
  // Add original headers (excluding Host)
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host') {
      forwardHeaders[key] = value;
    }
  }
  
  // Make request with appropriate method
  const requestOptions = {
    method: method,
    headers: forwardHeaders,
  };
  
  // Only add body for methods that support it
  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    requestOptions.body = body;
  }
  
  console.log(`[Magento API] Proxy request: ${method} ${proxyUrlWithParams}`);
  console.log(`[Magento API] Proxy headers:`, Object.keys(forwardHeaders).join(', '));
  
  const startTime = Date.now();
  const timeoutMs = 30000; // 30 second timeout
  
  console.log(`[Magento API] Starting fetch with ${timeoutMs}ms timeout...`);
  
  try {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.error(`[Magento API] ⏱️ Timeout triggered after ${timeoutMs}ms`);
        reject(new Error(`Proxy request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    // Create fetch promise with logging
    const fetchPromise = fetch(proxyUrlWithParams, requestOptions)
      .then(response => {
        const duration = Date.now() - startTime;
        console.log(`[Magento API] ✅ Fetch completed in ${duration}ms: ${response.status} ${response.statusText}`);
        return response;
      })
      .catch(fetchError => {
        const duration = Date.now() - startTime;
        console.error(`[Magento API] ❌ Fetch failed after ${duration}ms:`, fetchError.message);
        throw fetchError;
      });
    
    // Race between fetch and timeout
    console.log(`[Magento API] Racing fetch vs timeout...`);
    const response = await Promise.race([
      fetchPromise,
      timeoutPromise
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[Magento API] Proxy response received in ${duration}ms: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Magento API] Proxy request failed after ${duration}ms:`, error.message);
    console.error(`[Magento API] Error name:`, error.name);
    console.error(`[Magento API] Error stack:`, error.stack);
    throw error;
  }
}

/**
 * Make a GET request to the Magento API
 * @param {string} endpoint - API endpoint (relative to base URL, e.g., '/customers/search')
 * @param {Object} queryParams - Query parameters object
 * @returns {Promise<Object>} Response data
 */
const makeRequest = async (endpoint, queryParams = {}) => {
  try {
    // Build headers - NO admin token headers for Magento API!
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    
    // Add Bearer token if configured (REQUIRED for most Magento REST API endpoints)
    if (MAGENTO_BEARER_TOKEN) {
      headers['Authorization'] = `Bearer ${MAGENTO_BEARER_TOKEN}`;
      const tokenSource = process.env.MAGENTO_BEARER_TOKEN ? 'MAGENTO_BEARER_TOKEN' : 'SELLER_ADMIN_ACCESS_TOKEN';
      console.log(`[Magento API] Using Bearer token for authentication (from ${tokenSource})`);
    } else {
      console.warn('[Magento API] ⚠️ No Bearer token configured (MAGENTO_BEARER_TOKEN or SELLER_ADMIN_ACCESS_TOKEN).');
      console.warn('[Magento API] Customer endpoints may require authentication.');
    }
    
    // Build query string from queryParams object
    const queryString = new URLSearchParams();
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        queryString.append(key, queryParams[key]);
      }
    });
    
    // Ensure endpoint starts with / if base URL doesn't end with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Build the target URL (Magento API URL + endpoint + query params)
    const targetUrl = `${MAGENTO_API_BASE_URL}${cleanEndpoint}${queryString.toString() ? '?' + queryString.toString() : ''}`;
    
    console.log(`[Magento API] Target URL: ${targetUrl}`);
    console.log(`[Magento API] Headers:`, {
      'Content-Type': headers['Content-Type'],
      'Accept': headers['Accept'],
      'Authorization': headers['Authorization'] ? `${headers['Authorization'].substring(0, 15)}...` : 'none (no Bearer token)',
      'User-Agent': headers['User-Agent'] ? headers['User-Agent'].substring(0, 50) + '...' : 'missing',
      'X-Proxy-Secret': PROXY_BASE_URL ? '***' : 'not using proxy'
    });
    console.log(`[Magento API] ⚠️ NO admin token headers (Token-Type, etc.) - Magento REST API uses Bearer token only`);
    
    // If using proxy, route through proxy
    let response;
    if (PROXY_BASE_URL) {
      // Remove Accept-Encoding when using proxy to avoid gzip issues
      // The proxy should handle compression itself
      const proxyHeaders = { ...headers };
      delete proxyHeaders['Accept-Encoding'];
      
      console.log('[Magento API] Making proxy request...');
      response = await makeProxyRequest(targetUrl, 'GET', proxyHeaders);
      console.log(`[Magento API] Proxy response received: ${response.status} ${response.statusText}`);
    } else {
      // Direct request to Magento API (not recommended due to Cloudflare)
      console.warn('[Magento API] Direct request (no proxy configured) - may be blocked by Cloudflare');
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: headers
      });
      console.log(`[Magento API] Direct response received: ${response.status} ${response.statusText}`);
    }
    
    // Get response as array buffer first to handle potential gzip compression
    const contentType = response.headers.get('content-type') || '';
    const contentEncoding = response.headers.get('content-encoding') || '';
    console.log(`[Magento API] Response headers - Content-Type: ${contentType}, Content-Encoding: ${contentEncoding}`);
    
    let responseText;
    let responseData;
    
    if (!response.ok) {
      // For error responses, get as text first
      const buffer = await response.arrayBuffer();
      responseText = await decompressResponse(buffer, contentEncoding);
      
      console.error(`[Magento API] Error response: ${response.status} ${response.statusText}`);
      console.error(`[Magento API] Content-Type: ${contentType}`);
      console.error(`[Magento API] Content-Encoding: ${contentEncoding}`);
      console.error(`[Magento API] Error body:`, responseText.substring(0, 500));
      
      // Check if this is a Cloudflare block
      const isCloudflareBlock = responseText.includes('Cloudflare') || responseText.includes('cf-error-details') || responseText.includes('Sorry, you have been blocked');
      
      // Try to parse error as JSON for more details
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = errorJson;
      } catch (e) {
        // Not JSON, use as is
      }
      
      let errorMessage = `Magento API request failed: ${response.status} ${response.statusText}`;
      if (isCloudflareBlock) {
        errorMessage = `Cloudflare is blocking the request. Please configure PROXY_BASE_URL and PROXY_SECRET to use the proxy.`;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      error.details = errorDetails;
      error.isCloudflareBlock = isCloudflareBlock;
      throw error;
    }
    
    // For successful responses, handle potential gzip
    console.log('[Magento API] Reading response body...');
    const buffer = await response.arrayBuffer();
    console.log(`[Magento API] Response buffer size: ${buffer.byteLength} bytes`);
    
    responseText = await decompressResponse(buffer, contentEncoding);
    console.log(`[Magento API] Decompressed response length: ${responseText.length} characters`);
    console.log(`[Magento API] Response preview (first 200 chars):`, responseText.substring(0, 200));
    
    // Try to parse as JSON
    try {
      responseData = JSON.parse(responseText);
      console.log(`[Magento API] ✅ Successfully parsed JSON response. Type: ${typeof responseData}, Keys: ${responseData ? Object.keys(responseData).join(', ') : 'null'}`);
    } catch (parseError) {
      console.error('[Magento API] Failed to parse JSON response:', parseError.message);
      console.error('[Magento API] Response preview:', responseText.substring(0, 500));
      throw new Error(`Failed to parse JSON response: ${parseError.message}. Response may be gzipped or invalid JSON.`);
    }
    
    return responseData;
  } catch (error) {
    console.error('[Magento API] Request error:', error);
    throw error;
  }
};

module.exports = {
  makeRequest,
  makeProxyRequest,
  decompressResponse,
  MAGENTO_API_BASE_URL
};

