const prisma = require('../../lib/prisma');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - List all campaigns or get single campaign
    if (req.method === 'GET') {
      const { id, status, page = 1, pageSize = 50 } = req.query;

      if (id) {
        const campaign = await prisma.emailCampaign.findUnique({
          where: { id },
          include: {
            template: true,
            consumer: true,
            _count: {
              select: {
                emailEvents: true
              }
            }
          }
        });

        if (!campaign) {
          return res.status(404).json({
            success: false,
            error: 'Campaign not found'
          });
        }

        return res.json({
          success: true,
          data: campaign
        });
      }

      const where = {};
      if (status) where.status = status;

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const [campaigns, total] = await Promise.all([
        prisma.emailCampaign.findMany({
          where,
          skip,
          take,
          include: {
            template: true,
            consumer: true,
            _count: {
              select: {
                emailEvents: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.emailCampaign.count({ where })
      ]);

      return res.json({
        success: true,
        data: {
          campaigns,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize))
          }
        }
      });
    }

    // POST - Create new campaign
    if (req.method === 'POST') {
      const { name, subject, templateId, template, scheduledAt, filterCriteria, consumerId } = req.body;

      if (!name || !subject) {
        return res.status(400).json({
          success: false,
          error: 'name and subject are required'
        });
      }

      const campaign = await prisma.emailCampaign.create({
        data: {
          name,
          subject,
          templateId: templateId || null,
          template: template || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          filterCriteria: filterCriteria ? JSON.parse(JSON.stringify(filterCriteria)) : null,
          consumerId: consumerId || null,
          status: scheduledAt ? 'scheduled' : 'draft'
        },
        include: {
          template: true,
          consumer: true
        }
      });

      return res.json({
        success: true,
        data: campaign
      });
    }

    // PUT - Update campaign
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Campaign ID is required'
        });
      }

      // Handle JSON fields and dates
      if (updateData.filterCriteria && typeof updateData.filterCriteria === 'object') {
        updateData.filterCriteria = JSON.parse(JSON.stringify(updateData.filterCriteria));
      }
      if (updateData.scheduledAt) {
        updateData.scheduledAt = new Date(updateData.scheduledAt);
      }

      const campaign = await prisma.emailCampaign.update({
        where: { id },
        data: updateData,
        include: {
          template: true,
          consumer: true
        }
      });

      return res.json({
        success: true,
        data: campaign
      });
    }

    // DELETE - Delete campaign
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Campaign ID is required'
        });
      }

      await prisma.emailCampaign.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in campaigns API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

