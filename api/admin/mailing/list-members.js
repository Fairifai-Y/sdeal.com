const prisma = require('../../lib/prisma');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse body for POST requests (Vercel automatically parses JSON if Content-Type is application/json)
    let body = {};
    if (req.method === 'POST' && req.body) {
      // req.body is already parsed by Vercel if Content-Type is application/json
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    // Get listId from query (for GET/DELETE) or body (for POST)
    const listId = req.query.listId || body.listId;

    if (!listId) {
      return res.status(400).json({
        success: false,
        error: 'listId is required (in query for GET/DELETE, in body for POST)'
      });
    }

    // Verify list exists
    const list = await prisma.emailList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found'
      });
    }

    // GET - Get members of a list
    if (req.method === 'GET') {
      const { status, page = 1, pageSize = 50 } = req.query;

      const where = {
        listId: listId
      };

      if (status) {
        where.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const [members, total] = await Promise.all([
        prisma.emailListMember.findMany({
          where,
          skip,
          take,
          include: {
            consumer: true
          },
          orderBy: { subscribedAt: 'desc' }
        }),
        prisma.emailListMember.count({ where })
      ]);

      return res.json({
        success: true,
        data: {
          members,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize))
          }
        }
      });
    }

    // POST - Add members to list (single or bulk)
    if (req.method === 'POST') {
      // listId is already extracted above (from query or body)
      // Use parsed body from above
      const { consumerId, consumerIds, status = 'subscribed', source = 'manual' } = body;

      // Support both single consumerId and array of consumerIds
      const idsToAdd = consumerIds || (consumerId ? [consumerId] : []);

      if (idsToAdd.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'consumerId or consumerIds is required'
        });
      }

      // Verify all consumers exist
      const consumers = await prisma.consumer.findMany({
        where: {
          id: { in: idsToAdd }
        }
      });

      if (consumers.length !== idsToAdd.length) {
        const foundIds = consumers.map(c => c.id);
        const missingIds = idsToAdd.filter(id => !foundIds.includes(id));
        return res.status(404).json({
          success: false,
          error: `Some consumers not found: ${missingIds.join(', ')}`
        });
      }

      // Add members (use upsert to avoid duplicates)
      const results = [];
      const errors = [];

      for (const id of idsToAdd) {
        try {
          const member = await prisma.emailListMember.upsert({
            where: {
              listId_consumerId: {
                listId: listId,
                consumerId: id
              }
            },
            update: {
              status: status,
              source: source,
              subscribedAt: status === 'subscribed' ? new Date() : undefined
            },
            create: {
              listId: listId,
              consumerId: id,
              status: status,
              source: source
            },
            include: {
              consumer: true
            }
          });
          results.push(member);
        } catch (error) {
          errors.push({ consumerId: id, error: error.message });
        }
      }

      // Update list totalConsumers count
      const subscribedCount = await prisma.emailListMember.count({
        where: {
          listId: listId,
          status: 'subscribed'
        }
      });

      await prisma.emailList.update({
        where: { id: listId },
        data: { totalConsumers: subscribedCount }
      });

      return res.json({
        success: true,
        message: `Added ${results.length} member(s) to list`,
        data: {
          added: results.length,
          errors: errors.length,
          members: results,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    }

    // DELETE - Remove members from list
    if (req.method === 'DELETE') {
      const { consumerId, consumerIds } = req.query;

      const idsToRemove = consumerIds ? 
        (Array.isArray(consumerIds) ? consumerIds : consumerIds.split(',')) : 
        (consumerId ? [consumerId] : []);

      if (idsToRemove.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'consumerId or consumerIds is required'
        });
      }

      // Remove members
      const result = await prisma.emailListMember.deleteMany({
        where: {
          listId: listId,
          consumerId: { in: idsToRemove }
        }
      });

      // Update list totalConsumers count
      const subscribedCount = await prisma.emailListMember.count({
        where: {
          listId: listId,
          status: 'subscribed'
        }
      });

      await prisma.emailList.update({
        where: { id: listId },
        data: { totalConsumers: subscribedCount }
      });

      return res.json({
        success: true,
        message: `Removed ${result.count} member(s) from list`,
        data: {
          removed: result.count
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in list-members API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

