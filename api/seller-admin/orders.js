/**
 * Seller Admin API - Get Orders List
 * Supports filtering by supplier_id, date, status, pagination
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
    // Extract query parameters
    const {
      supplierId,
      supplierIds, // For multiple supplier IDs (comma-separated)
      orderStatus,
      orderStatuses, // For multiple statuses (comma-separated)
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 20
    } = req.query;

    // Build filters object
    const filters = {};

    // Handle supplier ID(s)
    if (supplierIds) {
      // Multiple supplier IDs
      filters.supplierId = supplierIds.split(',').map(id => id.trim());
    } else if (supplierId) {
      // Single supplier ID
      filters.supplierId = supplierId;
    }

    // Handle order status(es)
    if (orderStatuses) {
      // Multiple statuses
      filters.orderStatus = orderStatuses.split(',').map(s => s.trim());
    } else if (orderStatus) {
      // Single status
      filters.orderStatus = orderStatus;
    }

    // Date filters
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }

    if (dateTo) {
      filters.dateTo = dateTo;
    }

    // Pagination
    filters.page = parseInt(page, 10);
    filters.pageSize = parseInt(pageSize, 10);

    // Build search criteria query parameters
    const queryParams = buildSearchCriteria(filters);

    // Make request to Seller Admin API
    const data = await makeRequest('/supplier/orders/', queryParams);

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

