const { makeRequest, buildSearchCriteria } = require('../seller-admin/helpers');

/**
 * Get customers from Magento API
 * Supports pagination and filtering
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const { page = 1, pageSize = 100, searchCriteria } = req.query;

    // Build query parameters for Magento API
    const queryParams = {
      'searchCriteria[pageSize]': Math.min(parseInt(pageSize), 1000), // Magento max is usually 1000
      'searchCriteria[currentPage]': parseInt(page)
    };

    // Add custom search criteria if provided
    if (searchCriteria) {
      try {
        const criteria = JSON.parse(searchCriteria);
        Object.keys(criteria).forEach(key => {
          queryParams[`searchCriteria[${key}]`] = criteria[key];
        });
      } catch (e) {
        console.warn('Invalid searchCriteria JSON:', e);
      }
    }

    // Magento customers endpoint
    const endpoint = '/customers/search';
    
    console.log(`[Magento Customers] Fetching page ${page}, size ${pageSize}`);
    const data = await makeRequest(endpoint, queryParams);

    return res.json({
      success: true,
      data: {
        customers: data.items || [],
        totalCount: data.total_count || 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: data.total_count ? Math.ceil(data.total_count / parseInt(pageSize)) : 0
      }
    });

  } catch (error) {
    console.error('[Magento Customers] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch customers from Magento'
    });
  }
};

