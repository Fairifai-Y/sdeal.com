/**
 * GET /api/dashboard/reviews
 * Seller-scoped reviews. supplierId from PackageSelection (clerkUserId).
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
    const reviews = await makeRequest('/supplier/review', { supplierId });
    const sorted = Array.isArray(reviews)
    ? [...reviews].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
    : reviews;
    res.json({ success: true, data: sorted });
  } catch (err) {
    console.error('[Dashboard reviews]', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch reviews.' });
  }
};
