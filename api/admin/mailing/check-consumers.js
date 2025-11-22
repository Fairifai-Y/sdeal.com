const prisma = require('../../lib/prisma');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Use Promise.all to run queries in parallel (but limit to prevent pool exhaustion)
    const [totalCount, bySource, recentConsumers] = await Promise.all([
      prisma.consumer.count(),
      prisma.consumer.groupBy({
        by: ['source'],
        _count: {
          id: true
        }
      }),
      prisma.consumer.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          store: true,
          country: true,
          source: true,
          createdAt: true
        }
      })
    ]);

    // Get consumers from magento sync (only if we have space in pool)
    const magentoConsumers = recentConsumers.filter(c => c.source === 'magento_sync').slice(0, 5);

    return res.json({
      success: true,
      data: {
        totalCount,
        bySource: bySource.map(item => ({
          source: item.source || 'null',
          count: item._count.id
        })),
        recentConsumers,
        magentoConsumers,
        summary: {
          total: totalCount,
          fromMagentoSync: bySource.find(s => s.source === 'magento_sync')?._count.id || 0,
          recentCount: recentConsumers.length
        }
      }
    });
  } catch (error) {
    console.error('Error checking consumers:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

