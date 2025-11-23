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

    // POST - Create new campaign or send campaign
    if (req.method === 'POST') {
      const { action, id, ...campaignData } = req.body;

      // Send campaign action
      if (action === 'send' && id) {
        const campaign = await prisma.emailCampaign.findUnique({
          where: { id },
          include: {
            template: true
          }
        });

        if (!campaign) {
          return res.status(404).json({
            success: false,
            error: 'Campaign not found'
          });
        }

        if (campaign.status === 'sending' || campaign.status === 'sent') {
          return res.status(400).json({
            success: false,
            error: 'Campaign is already sent or being sent'
          });
        }

        if (!campaign.templateId) {
          return res.status(400).json({
            success: false,
            error: 'Campaign must have a template to send'
          });
        }

        // Get recipients from filterCriteria (listId or other filters)
        const filterCriteria = campaign.filterCriteria || {};
        let recipients = [];

        if (filterCriteria.listId) {
          // Get consumers from list
          const listMembers = await prisma.emailListMember.findMany({
            where: {
              listId: filterCriteria.listId,
              status: 'subscribed'
            },
            include: {
              consumer: true
            }
          });
          recipients = listMembers.map(member => member.consumer);
        } else if (filterCriteria.store || filterCriteria.country) {
          // Get consumers by store/country
          const where = {
            isUnsubscribed: false
          };
          if (filterCriteria.store) where.store = filterCriteria.store;
          if (filterCriteria.country) where.country = filterCriteria.country;
          
          recipients = await prisma.consumer.findMany({ where });
        } else {
          // Get all active consumers
          recipients = await prisma.consumer.findMany({
            where: {
              isUnsubscribed: false
            }
          });
        }

        // Filter out consumers without email
        recipients = recipients.filter(c => c.email && c.email.includes('@'));

        // Update campaign status and recipient count
        const updatedCampaign = await prisma.emailCampaign.update({
          where: { id },
          data: {
            status: 'sending',
            totalRecipients: recipients.length,
            sentAt: new Date()
          }
        });

        // Start sending emails in background (for now, just mark as sent)
        // In production, you would queue these emails
        console.log(`[Campaign] Starting to send campaign ${id} to ${recipients.length} recipients`);

        // For now, mark as sent (in production, implement actual email sending)
        setTimeout(async () => {
          try {
            await prisma.emailCampaign.update({
              where: { id },
              data: {
                status: 'sent',
                totalSent: recipients.length
              }
            });
            console.log(`[Campaign] Campaign ${id} marked as sent`);
          } catch (error) {
            console.error(`[Campaign] Error updating campaign status:`, error);
          }
        }, 1000);

        return res.json({
          success: true,
          message: `Campaign is being sent to ${recipients.length} recipients`,
          data: {
            ...updatedCampaign,
            recipientCount: recipients.length
          }
        });
      }

      // Create new campaign
      const { name, subject, templateId, listId, scheduledAt, filterCriteria, consumerId } = campaignData;

      if (!name || !subject) {
        return res.status(400).json({
          success: false,
          error: 'name and subject are required'
        });
      }

      // Build filterCriteria from listId or provided criteria
      let finalFilterCriteria = filterCriteria || {};
      if (listId) {
        finalFilterCriteria = { ...finalFilterCriteria, listId };
      }

      const campaign = await prisma.emailCampaign.create({
        data: {
          name,
          subject,
          templateId: templateId || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          filterCriteria: finalFilterCriteria ? JSON.parse(JSON.stringify(finalFilterCriteria)) : null,
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
      const { id, listId, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Campaign ID is required'
        });
      }

      // Handle listId in filterCriteria
      if (listId !== undefined) {
        updateData.filterCriteria = updateData.filterCriteria || {};
        if (listId) {
          updateData.filterCriteria.listId = listId;
        } else {
          delete updateData.filterCriteria.listId;
        }
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

