/**
 * Seller Admin API - Get Specific Order Details
 * Returns complete order information including items
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
    // Extract order ID from query parameters or path
    const orderId = req.query.orderId || req.query.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required. Use ?orderId=123 or ?id=123'
      });
    }

    // Make request to Seller Admin API
    const data = await makeRequest(`/supplier/order/${orderId}`);

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

