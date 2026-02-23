/**
 * GET /api/dashboard/me
 * Returns the current user's seller info (supplierId and package selection data) from PackageSelection.
 * Requires Clerk Bearer token and a linked account (clerkUserId set in PackageSelection).
 */

const { requireDashboardAuth } = require('./auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  if (!(await requireDashboardAuth(req, res))) return;

  const { supplierId, packageSelection } = req.dashboardUser;

  res.json({
    success: true,
    data: {
      supplierId,
      sellerId: supplierId, // alias
      sellerEmail: packageSelection.sellerEmail ?? undefined,
      package: packageSelection.package,
      language: packageSelection.language,
      companyName: packageSelection.companyName ?? undefined,
      firstName: packageSelection.firstName ?? undefined,
      lastName: packageSelection.lastName ?? undefined,
    },
  });
};
