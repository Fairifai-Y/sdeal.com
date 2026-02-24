/**
 * GET /api/admin/sellers
 * Admin only. Returns a list of all sellers (PackageSelection records).
 * Lightweight payload: id, sellerId, sellerEmail, companyName, firstName, lastName, package, clerkUserId, createdAt.
 */

const { requireAuth } = require('./auth');
const prisma = require('../lib/prisma-with-retry');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed.' });

  if (!(await requireAuth(req, res))) return;

  try {
    const sellers = await prisma.packageSelection.findMany({
      select: {
        id: true,
        sellerId: true,
        sellerEmail: true,
        companyName: true,
        firstName: true,
        lastName: true,
        package: true,
        clerkUserId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        sellers,
        total: sellers.length,
      },
    });
  } catch (error) {
    console.error('[Admin sellers]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sellers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
