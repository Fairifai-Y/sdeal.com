/**
 * Seller Admin API - Get Seller Balance Data
 * Returns balance information for a specific supplier
 */

const { makeRequest, buildSearchCriteria } = require('./helpers');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    // Extract supplier ID from query parameters
    const { supplierId } = req.query;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        error: 'Supplier ID is required. Use ?supplierId=1773'
      });
    }

    // Build search criteria for balance API
    const filters = {
      supplierId: supplierId
    };
    const queryParams = buildSearchCriteria(filters);

    // Make request to Seller Admin API
    const data = await makeRequest('/sportdeal-balancemanagement/balance/search/', queryParams);

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching balance data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

