/**
 * Helper functions for Seller Admin API integration
 * Handles authentication and HTTP requests to the external SDeal Admin API
 */

const SELLER_ADMIN_API_BASE_URL = process.env.SELLER_ADMIN_API_BASE_URL || 'https://www.sportdeal.nl/rest/V1';
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
    'Accept': 'application/json'
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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Seller Admin API] Error response: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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

