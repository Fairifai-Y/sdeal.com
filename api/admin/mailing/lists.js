const prisma = require('../../lib/prisma');

module.exports = async (req, res) => {
  // Set headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`[Lists API] ${req.method} request received`);
  console.log(`[Lists API] Body:`, req.body ? JSON.stringify(req.body).substring(0, 200) : 'no body');

  try {
    // GET - List all lists or get single list
    if (req.method === 'GET') {
      const { id, includeMembers } = req.query;

      if (id) {
        const list = await prisma.emailList.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                listMembers: {
                  where: {
                    status: 'subscribed'
                  }
                }
              }
            },
            listMembers: includeMembers === 'true' ? {
              include: {
                consumer: true
              },
              take: 100,
              orderBy: { subscribedAt: 'desc' }
            } : false
          }
        });

        if (!list) {
          return res.status(404).json({
            success: false,
            error: 'List not found'
          });
        }

        // Get unsubscribed count
        const unsubscribedCount = await prisma.emailListMember.count({
          where: {
            listId: id,
            status: 'unsubscribed'
          }
        });

        return res.json({
          success: true,
          data: {
            ...list,
            totalConsumers: list._count.listMembers,
            unsubscribedCount: unsubscribedCount
          }
        });
      }

      const lists = await prisma.emailList.findMany({
        include: {
          _count: {
            select: {
              listMembers: {
                where: {
                  status: 'subscribed'
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get unsubscribed counts for each list
      const listsWithCounts = await Promise.all(lists.map(async (list) => {
        const unsubscribedCount = await prisma.emailListMember.count({
          where: {
            listId: list.id,
            status: 'unsubscribed'
          }
        });

        return {
          ...list,
          totalConsumers: list._count.listMembers,
          unsubscribedCount: unsubscribedCount
        };
      }));

      return res.json({
        success: true,
        data: listsWithCounts
      });
    }

    // POST - Create new list
    if (req.method === 'POST') {
      console.log('[Lists API] POST handler called');
      const { name, description, isPublic, doubleOptIn } = req.body;
      console.log('[Lists API] Request data:', { name, description, isPublic, doubleOptIn });

      if (!name) {
        console.log('[Lists API] Validation failed: name is required');
        return res.status(400).json({
          success: false,
          error: 'name is required'
        });
      }

      console.log('[Lists API] Creating list in database...');
      const list = await prisma.emailList.create({
        data: {
          name,
          description,
          isPublic: isPublic !== undefined ? isPublic : false,
          doubleOptIn: doubleOptIn !== undefined ? doubleOptIn : true
        }
      });
      console.log('[Lists API] List created successfully:', list.id);

      return res.json({
        success: true,
        data: list
      });
    }

    // PUT - Update list
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'List ID is required'
        });
      }

      const list = await prisma.emailList.update({
        where: { id },
        data: updateData
      });

      return res.json({
        success: true,
        data: list
      });
    }

    // DELETE - Delete list
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'List ID is required'
        });
      }

      await prisma.emailList.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'List deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in lists API:', error);
    // Ensure we always return a JSON response
    try {
      if (res.status) {
        return res.status(500).json({
          success: false,
          error: error.message || 'Internal server error'
        });
      } else {
        return res.json({
          success: false,
          error: error.message || 'Internal server error'
        });
      }
    } catch (responseError) {
      console.error('Error sending error response:', responseError);
      // Last resort - try to send plain response
      if (res.end) {
        res.end(JSON.stringify({
          success: false,
          error: error.message || 'Internal server error'
        }));
      }
    }
  }
};

