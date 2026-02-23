/**
 * GET /api/dashboard/delivery-info
 * Seller-scoped delivery info. supplierId from PackageSelection (clerkUserId).
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

  const { supplierId } = req.dashboardUser;
  try {
    const data = await makeRequest('/sportdeal-delivery/info/', { supplierId });
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Dashboard delivery-info]', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch delivery info.' });
  }
};
