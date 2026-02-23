/**
 * GET /api/dashboard/order?orderId=...
 * Seller-scoped: single order details (uses same auth as dashboard orders list).
 */

const { requireDashboardAuth } = require('./auth');
const { makeRequest } = require('../seller-admin/helpers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed.' });

  if (!(await requireDashboardAuth(req, res))) return;

  const orderId = req.query.orderId || req.query.id;
  if (!orderId) {
    return res.status(400).json({ success: false, error: 'orderId required' });
  }

  try {
    const data = await makeRequest(`/supplier/order/${orderId}`);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Dashboard order]', err);
    res.status(err.status === 404 ? 404 : 500).json({
      success: false,
      error: err.message || 'Failed to fetch order.',
    });
  }
};
