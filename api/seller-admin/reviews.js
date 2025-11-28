/**
 * Seller Admin API - Get Supplier Reviews
 * 
 * Fetches reviews for a specific supplier from the Seller Admin API
 * Endpoint: /supplier/review?supplierId={supplierId}
 */

const { makeRequest } = require('./helpers');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { supplierId } = req.query;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        error: 'supplierId is required'
      });
    }

    console.log(`[Seller Admin API] Fetching reviews for supplier ID: ${supplierId}`);

    // Make request to Seller Admin API
    const reviews = await makeRequest('/supplier/review', {
      supplierId: supplierId
    });

    // Sort reviews by created_at (newest first)
    if (Array.isArray(reviews)) {
      reviews.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Newest first
      });
    }

    console.log(`[Seller Admin API] ✅ Successfully fetched ${Array.isArray(reviews) ? reviews.length : 0} reviews for supplier ${supplierId}`);

    return res.json({
      success: true,
      data: reviews || []
    });

  } catch (error) {
    console.error('[Seller Admin API] Error fetching reviews:', error);
    
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to fetch reviews',
      details: error.details || null
    });
  }
};

