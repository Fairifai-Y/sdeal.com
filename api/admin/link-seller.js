/**
 * POST /api/admin/link-seller
 * Admin only. Links a Clerk user to a seller (PackageSelection): set clerkUserId for the given sellerId.
 * Body: { clerkUserId: "user_xxx", sellerId: "1773" }
 * If no PackageSelection exists for that sellerId, returns 404. Otherwise updates the most recent one.
 */

const { requireAuth } = require('./auth');
const prisma = require('../lib/prisma-with-retry');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed.' });

  if (!(await requireAuth(req, res))) return;

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid JSON body.' });
    }
  }

  const { clerkUserId, sellerId } = body || {};
  if (!clerkUserId || !sellerId) {
    return res.status(400).json({
      success: false,
      error: 'Body must include clerkUserId and sellerId.',
    });
  }

  const sellerIdStr = String(sellerId).trim();
  const clerkUserIdStr = String(clerkUserId).trim();

  const existing = await prisma.packageSelection.findFirst({
    where: { sellerId: sellerIdStr },
    orderBy: { createdAt: 'desc' },
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: `No PackageSelection found for sellerId "${sellerIdStr}". Create a signup first or use an existing sellerId.`,
    });
  }

  // Unlink this Clerk user from any other PackageSelection (so unique constraint holds)
  await prisma.packageSelection.updateMany({
    where: { clerkUserId: clerkUserIdStr },
    data: { clerkUserId: null },
  });

  await prisma.packageSelection.update({
    where: { id: existing.id },
    data: { clerkUserId: clerkUserIdStr },
  });

  res.json({
    success: true,
    data: {
      id: existing.id,
      sellerId: sellerIdStr,
      clerkUserId: clerkUserIdStr,
      message: 'Clerk user linked to seller.',
    },
  });
};
