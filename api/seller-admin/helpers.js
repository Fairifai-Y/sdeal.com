/**
 * Helper functions for Seller Admin API integration
 * Handles authentication and HTTP requests to the external SDeal Admin API
 */

const SELLER_ADMIN_API_BASE_URL = process.env.SELLER_ADMIN_API_BASE_URL || 'https://www.sdeal.nl/rest/V1';
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

  return {
    'Authorization': accessToken,
    'Token-Type': 'admin',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
    
    const url = `${SELLER_ADMIN_API_BASE_URL}${endpoint}${queryString.toString() ? '?' + queryString.toString() : ''}`;
    
    console.log(`[Seller Admin API] Making request to: ${url}`);
    console.log(`[Seller Admin API] Headers:`, {
      Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 10)}...` : 'missing',
      'Token-Type': headers['Token-Type'],
      'Content-Type': headers['Content-Type'],
      'Accept': headers['Accept']
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
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

