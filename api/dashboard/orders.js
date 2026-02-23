/**
 * GET /api/dashboard/orders
 * Seller-scoped orders: uses supplierId from PackageSelection (clerkUserId). Same params as seller-admin/orders except supplierId.
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
  const { orderStatus, orderStatuses, dateFrom, dateTo, page = 1, pageSize = 20 } = req.query;

  const filters = { supplierId, sortBy: 'created_at', sortDirection: 'DESC' };
  if (orderStatuses) filters.orderStatus = orderStatuses.split(',').map((s) => s.trim());
  else if (orderStatus) filters.orderStatus = orderStatus;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  filters.page = parseInt(page, 10);
  filters.pageSize = parseInt(pageSize, 10);

  try {
    const queryParams = buildSearchCriteria(filters);
    const data = await makeRequest('/supplier/orders/', queryParams);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Dashboard orders]', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch orders.' });
  }
};
