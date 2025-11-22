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
    // GET - List all templates or get single template
    if (req.method === 'GET') {
      const { id, category, isActive } = req.query;

      if (id) {
        const template = await prisma.emailTemplate.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                campaigns: true,
                workflowSteps: true
              }
            }
          }
        });

        if (!template) {
          return res.status(404).json({
            success: false,
            error: 'Template not found'
          });
        }

        return res.json({
          success: true,
          data: template
        });
      }

      const where = {};
      if (category) where.category = category;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const templates = await prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              campaigns: true,
              workflowSteps: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: templates
      });
    }

    // POST - Create new template
    if (req.method === 'POST') {
      const { name, subject, htmlContent, textContent, availableVariables, category, isActive } = req.body;

      if (!name || !subject || !htmlContent) {
        return res.status(400).json({
          success: false,
          error: 'name, subject, and htmlContent are required'
        });
      }

      const template = await prisma.emailTemplate.create({
        data: {
          name,
          subject,
          htmlContent,
          textContent,
          availableVariables: availableVariables ? JSON.parse(JSON.stringify(availableVariables)) : null,
          category,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      return res.json({
        success: true,
        data: template
      });
    }

    // PUT - Update template
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Template ID is required'
        });
      }

      // Handle JSON fields
      if (updateData.availableVariables && typeof updateData.availableVariables === 'object') {
        updateData.availableVariables = JSON.parse(JSON.stringify(updateData.availableVariables));
      }

      const template = await prisma.emailTemplate.update({
        where: { id },
        data: updateData
      });

      return res.json({
        success: true,
        data: template
      });
    }

    // DELETE - Delete template
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Template ID is required'
        });
      }

      // Check if template is used in campaigns or workflows
      const template = await prisma.emailTemplate.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              campaigns: true,
              workflowSteps: true
            }
          }
        }
      });

      if (template._count.campaigns > 0 || template._count.workflowSteps > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete template that is used in campaigns or workflows'
        });
      }

      await prisma.emailTemplate.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in templates API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

