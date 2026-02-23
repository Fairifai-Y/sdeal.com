/**
 * Dashboard authentication: verify Clerk token and resolve supplier_id from PackageSelection (clerkUserId).
 * Sets req.dashboardUser = { userId, supplierId, packageSelection } and returns true, or sends error and returns false.
 */

const { createClerkClient, verifyToken } = require('@clerk/backend');
const prisma = require('../lib/prisma-with-retry');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const clerkClient = CLERK_SECRET_KEY ? createClerkClient({ secretKey: CLERK_SECRET_KEY }) : null;

/**
 * Get supplier_id (sellerId) for a Clerk user from PackageSelection.clerkUserId.
 * @param {string} clerkUserId - Clerk user ID (e.g. user_xxx)
 * @returns {Promise<{ supplierId: string, packageSelection: object } | null>}
 */
async function getSupplierIdForClerkUser(clerkUserId) {
  const id = typeof clerkUserId === 'string' ? clerkUserId.trim() : clerkUserId;
  if (!id) return null;
  const row = await prisma.packageSelection.findFirst({
    where: { clerkUserId: id },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return null;
  return {
    supplierId: String(row.sellerId),
    packageSelection: row,
  };
}

/**
 * Verify Clerk Bearer token (any signed-in user). Does not require admin.
 */
async function verifyClerkToken(token) {
  if (!CLERK_SECRET_KEY || !clerkClient) {
    return { valid: false, error: 'Clerk not configured' };
  }
  try {
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    const userId = payload.sub;
    if (!userId) return { valid: false, error: 'Invalid token' };
    return { valid: true, userId };
  } catch (error) {
    return { valid: false, error: error.message || 'Invalid token' };
  }
}

/**
 * Protect dashboard API routes: require Clerk auth and a linked seller (clerkUserId in PackageSelection).
 * On success: req.dashboardUser = { userId, supplierId, packageSelection }. Returns true.
 * On failure: sends 401/403 and returns false.
 */
async function requireDashboardAuth(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return false;
  }

  const clerkResult = await verifyClerkToken(token);
  if (!clerkResult.valid) {
    res.status(401).json({ success: false, error: clerkResult.error || 'Invalid token.' });
    return false;
  }

  const link = await getSupplierIdForClerkUser(clerkResult.userId);
  if (!link) {
    res.status(403).json({
      success: false,
      error: 'Account not linked to a seller. Please contact support to link your account.',
    });
    return false;
  }

  req.dashboardUser = {
    userId: clerkResult.userId,
    supplierId: link.supplierId,
    packageSelection: link.packageSelection,
  };
  return true;
}

module.exports = {
  getSupplierIdForClerkUser,
  verifyClerkToken,
  requireDashboardAuth,
};
