/**
 * GET /api/dashboard/balance
 * Seller-scoped balance. supplierId from PackageSelection (clerkUserId).
 */

const { requireDashboardAuth } = require('./auth');
const { makeRequest, buildSearchCriteria } = require('../seller-admin/helpers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed.' });

  if (!(await requireDashboardAuth(req, res))) return;

  const { supplierId } = req.dashboardUser;
  try {
    const queryParams = buildSearchCriteria({ supplierId });
    const data = await makeRequest('/sportdeal-balancemanagement/balance/search/', queryParams);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Dashboard balance]', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch balance.' });
  }
};
