const prisma = require('../lib/prisma');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const { status, page = 1, pageSize = 50, search } = req.query;

    // Build where clause
    const where = {};
    
    if (status) {
      where.paymentStatus = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { molliePaymentId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    // Fetch registrations with pagination
    const [registrations, total] = await Promise.all([
      prisma.lifetimeDiscountRegistration.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.lifetimeDiscountRegistration.count({ where })
    ]);

    // Get status counts
    const statusCounts = await prisma.lifetimeDiscountRegistration.groupBy({
      by: ['paymentStatus'],
      _count: true
    });

    const statusCountsMap = {};
    statusCounts.forEach(item => {
      statusCountsMap[item.paymentStatus] = item._count;
    });

    return res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      },
      statusCounts: statusCountsMap
    });

  } catch (error) {
    console.error('[LDG] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch LDG registrations'
    });
  }
};

