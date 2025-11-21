const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - List bounces with filters
    if (req.method === 'GET') {
      const { bounceType, page = 1, pageSize = 50, consumerId, campaignId } = req.query;

      const where = {
        eventType: 'bounced'
      };

      if (bounceType) where.bounceType = bounceType;
      if (consumerId) where.consumerId = consumerId;
      if (campaignId) where.campaignId = campaignId;

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const [bounces, total] = await Promise.all([
        prisma.emailEvent.findMany({
          where,
          skip,
          take,
          include: {
            consumer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            campaign: {
              select: {
                id: true,
                name: true,
                subject: true
              }
            }
          },
          orderBy: { occurredAt: 'desc' }
        }),
        prisma.emailEvent.count({ where })
      ]);

      // Get bounce statistics
      const [hardBounces, softBounces] = await Promise.all([
        prisma.emailEvent.count({
          where: { ...where, bounceType: 'hard' }
        }),
        prisma.emailEvent.count({
          where: { ...where, bounceType: 'soft' }
        })
      ]);

      return res.json({
        success: true,
        data: {
          bounces,
          statistics: {
            total: total,
            hard: hardBounces,
            soft: softBounces
          },
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize))
          }
        }
      });
    }

    // POST - Record a bounce (usually called from webhook)
    if (req.method === 'POST') {
      const { campaignId, consumerId, bounceType, bounceReason, eventData, userAgent, ipAddress } = req.body;

      if (!campaignId || !consumerId || !bounceType) {
        return res.status(400).json({
          success: false,
          error: 'campaignId, consumerId, and bounceType are required'
        });
      }

      if (!['soft', 'hard'].includes(bounceType)) {
        return res.status(400).json({
          success: false,
          error: 'bounceType must be "soft" or "hard"'
        });
      }

      // Create bounce event
      const bounceEvent = await prisma.emailEvent.create({
        data: {
          campaignId,
          consumerId,
          eventType: 'bounced',
          bounceType,
          bounceReason,
          eventData: eventData ? JSON.parse(JSON.stringify(eventData)) : null,
          userAgent,
          ipAddress,
          occurredAt: new Date()
        },
        include: {
          consumer: true,
          campaign: true
        }
      });

      // Update campaign bounce count
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          totalBounced: { increment: 1 }
        }
      });

      // If hard bounce, mark consumer email as problematic
      if (bounceType === 'hard') {
        // You might want to add a flag to Consumer model for this
        // For now, we'll just track it in the event
      }

      return res.json({
        success: true,
        data: bounceEvent
      });
    }

    // DELETE - Clean up old bounces (cleanup endpoint)
    if (req.method === 'DELETE') {
      const { days = 90, bounceType, hardBouncesOnly } = req.query;

      const where = {
        eventType: 'bounced',
        occurredAt: {
          lt: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
        }
      };

      if (hardBouncesOnly === 'true') {
        where.bounceType = 'hard';
      } else if (bounceType) {
        where.bounceType = bounceType;
      }

      const deleted = await prisma.emailEvent.deleteMany({
        where
      });

      return res.json({
        success: true,
        message: `Deleted ${deleted.count} bounce events older than ${days} days`,
        deletedCount: deleted.count
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in bounces API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

