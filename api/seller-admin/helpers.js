/**
 * Helper functions for Seller Admin API integration
 * Handles authentication and HTTP requests to the external SDeal Admin API
 */

// Proxy configuration
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || '';
const PROXY_SECRET = process.env.PROXY_SECRET || '';

// Original API base URL (the target that the proxy will forward to)
const ORIGINAL_API_BASE_URL = (process.env.SELLER_ADMIN_API_BASE_URL || 'https://www.sdeal.nl/rest/V1').replace(/\/$/, '');

// If proxy is configured, use proxy URL, otherwise use original API URL
const SELLER_ADMIN_API_BASE_URL = PROXY_BASE_URL || ORIGINAL_API_BASE_URL;
const ADMIN_ACCESS_TOKEN = process.env.SELLER_ADMIN_ACCESS_TOKEN || '';

/**
 * Get authentication headers for Seller Admin API requests
 * @returns {Object} Headers object with Authorization and Token-Type
 */
const getAuthHeaders = () => {
  const accessToken = ADMIN_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('Seller Admin API access token is not configured. Please set SELLER_ADMIN_ACCESS_TOKEN environment variable.');
  }

  // User-Agent can be customized via environment variable, or use default browser-like one
  const userAgent = process.env.SELLER_ADMIN_USER_AGENT || 
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  return {
    'Authorization': accessToken,
    'Token-Type': 'admin',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': userAgent,
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
};

/**
 * Make a GET request to the Seller Admin API
 * @param {string} endpoint - API endpoint (relative to base URL)
 * @param {Object} queryParams - Query parameters object
 * @returns {Promise<Object>} Response data
 */
const makeRequest = async (endpoint, queryParams = {}) => {
  try {
    const headers = getAuthHeaders();
    
    // Build query string from queryParams object
    const queryString = new URLSearchParams();
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        queryString.append(key, queryParams[key]);
      }
    });
    
    // Ensure endpoint starts with / if base URL doesn't end with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    let url;
    let finalHeaders = { ...headers };
    
    // If using proxy, construct the request differently
    if (PROXY_BASE_URL) {
      // Build the target URL (original API URL + endpoint + query params)
      const targetUrl = `${ORIGINAL_API_BASE_URL}${cleanEndpoint}${queryString.toString() ? '?' + queryString.toString() : ''}`;
      
      // Proxy URL with target URL as query parameter
      const proxyQueryString = new URLSearchParams();
      proxyQueryString.append('url', targetUrl);
      url = `${PROXY_BASE_URL}?${proxyQueryString.toString()}`;
      
      // Add proxy secret to headers if configured
      // Try multiple common header names for proxy authentication
      if (PROXY_SECRET) {
        finalHeaders['X-Proxy-Secret'] = PROXY_SECRET;
        // Also try alternative header names (uncomment if your proxy uses a different name)
        // finalHeaders['Proxy-Secret'] = PROXY_SECRET;
        // finalHeaders['X-API-Key'] = PROXY_SECRET;
      }
      
      // Keep the original API headers - the proxy should forward these to the target API
      // The Authorization and Token-Type headers will be sent to the proxy,
      // and the proxy should forward them to sdeal.nl/rest/V1
      
      console.log(`[Seller Admin API] Using proxy: ${PROXY_BASE_URL}`);
      console.log(`[Seller Admin API] Target URL: ${targetUrl}`);
      console.log(`[Seller Admin API] Proxy URL: ${url}`);
    } else {
      // Direct request to API
      url = `${SELLER_ADMIN_API_BASE_URL}${cleanEndpoint}${queryString.toString() ? '?' + queryString.toString() : ''}`;
      console.log(`[Seller Admin API] Direct request to: ${url}`);
    }
    
    console.log(`[Seller Admin API] Base URL: ${SELLER_ADMIN_API_BASE_URL}`);
    console.log(`[Seller Admin API] Endpoint: ${cleanEndpoint}`);
    console.log(`[Seller Admin API] Full URL: ${url}`);
    console.log(`[Seller Admin API] Headers:`, {
      Authorization: finalHeaders.Authorization ? `${finalHeaders.Authorization.substring(0, 10)}...` : 'missing',
      'Token-Type': finalHeaders['Token-Type'],
      'X-Proxy-Secret': finalHeaders['X-Proxy-Secret'] ? '***' : 'missing',
      'Content-Type': finalHeaders['Content-Type'],
      'Accept': finalHeaders['Accept'],
      'User-Agent': finalHeaders['User-Agent'] ? finalHeaders['User-Agent'].substring(0, 50) + '...' : 'missing'
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: finalHeaders
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Seller Admin API] Error response: ${response.status} ${response.statusText}`);
      console.error(`[Seller Admin API] Error body:`, errorText.substring(0, 500));
      
      // Check if this is a Cloudflare block
      const isCloudflareBlock = errorText.includes('Cloudflare') || errorText.includes('cf-error-details') || errorText.includes('Sorry, you have been blocked');
      
      // Try to parse error as JSON for more details
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson;
      } catch (e) {
        // Not JSON, use as is
      }
      
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      if (isCloudflareBlock) {
        errorMessage = `Cloudflare is blocking the request. This usually means the request is being flagged as a bot. The API might need to whitelist Vercel's IP addresses or adjust Cloudflare settings.`;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      error.details = errorDetails;
      error.isCloudflareBlock = isCloudflareBlock;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Seller Admin API] Request error:', error);
    throw error;
  }
};

/**
 * Build search criteria query parameters for Magento-style API
 * @param {Object} filters - Filter configuration
 * @returns {Object} Query parameters object
 */
const buildSearchCriteria = (filters = {}) => {
  const params = {};
  let filterGroupIndex = 0;

  // Helper to add a filter
  const addFilter = (field, value, conditionType = 'eq', filterGroupIdx = filterGroupIndex) => {
    params[`searchCriteria[filter_groups][${filterGroupIdx}][filters][0][field]`] = field;
    params[`searchCriteria[filter_groups][${filterGroupIdx}][filters][0][value]`] = value;
    params[`searchCriteria[filter_groups][${filterGroupIdx}][filters][0][condition_type]`] = conditionType;
  };

  // Add supplier_id filter
  if (filters.supplierId) {
    if (Array.isArray(filters.supplierId)) {
      // Multiple supplier IDs - use 'in' condition
      addFilter('supplier_id', filters.supplierId.join(','), 'in', filterGroupIndex);
    } else {
      addFilter('supplier_id', filters.supplierId, 'eq', filterGroupIndex);
    }
    filterGroupIndex++;
  }

  // Add order_status filter
  if (filters.orderStatus !== undefined) {
    if (Array.isArray(filters.orderStatus)) {
      // Multiple statuses - use 'in' condition
      addFilter('order_status', filters.orderStatus.join(','), 'in', filterGroupIndex);
    } else {
      addFilter('order_status', filters.orderStatus, 'eq', filterGroupIndex);
    }
    filterGroupIndex++;
  }

  // Add date filters
  if (filters.dateFrom) {
    addFilter('created_at', filters.dateFrom, 'gteq', filterGroupIndex);
    filterGroupIndex++;
  }

  if (filters.dateTo) {
    addFilter('created_at', filters.dateTo, 'lteq', filterGroupIndex);
    filterGroupIndex++;
  }

  // Add pagination
  if (filters.page) {
    params['searchCriteria[currentPage]'] = filters.page;
  }

  if (filters.pageSize) {
    params['searchCriteria[pageSize]'] = filters.pageSize;
  }

  return params;
};

module.exports = {
  getAuthHeaders,
  makeRequest,
  buildSearchCriteria,
  SELLER_ADMIN_API_BASE_URL
};

