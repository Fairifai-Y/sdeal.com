/**
 * Seller Admin API - Get Delivery Info
 * Returns delivery reliability and statistics for a supplier
 */

const { makeRequest } = require('./helpers');

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

    // Build query parameters
    const queryParams = {
      supplierId: supplierId
    };

    // Make request to Seller Admin API
    const data = await makeRequest('/sportdeal-delivery/info/', queryParams);

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching delivery info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery info',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

