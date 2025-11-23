const prisma = require('../../lib/prisma');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

        return res.json({
          success: true,
          data: {
            ...list,
            totalConsumers: list._count.listMembers
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

      // Update totalConsumers from count (only subscribed members)
      const listsWithCount = lists.map(list => ({
        ...list,
        totalConsumers: list._count.listMembers
      }));

      return res.json({
        success: true,
        data: listsWithCount
      });
    }

    // POST - Create new list
    if (req.method === 'POST') {
      const { name, description, isPublic, doubleOptIn } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'name is required'
        });
      }

      const list = await prisma.emailList.create({
        data: {
          name,
          description,
          isPublic: isPublic !== undefined ? isPublic : false,
          doubleOptIn: doubleOptIn !== undefined ? doubleOptIn : true
        }
      });

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
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

