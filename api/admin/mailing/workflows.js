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
    // GET - List all workflows or get single workflow
    if (req.method === 'GET') {
      const { id, triggerType, isActive } = req.query;

      if (id) {
        const workflow = await prisma.emailWorkflow.findUnique({
          where: { id },
          include: {
            steps: {
              include: {
                template: true
              },
              orderBy: { stepOrder: 'asc' }
            },
            _count: {
              select: {
                executions: true
              }
            }
          }
        });

        if (!workflow) {
          return res.status(404).json({
            success: false,
            error: 'Workflow not found'
          });
        }

        return res.json({
          success: true,
          data: workflow
        });
      }

      const where = {};
      if (triggerType) where.triggerType = triggerType;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const workflows = await prisma.emailWorkflow.findMany({
        where,
        include: {
          _count: {
            select: {
              steps: true,
              executions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: workflows
      });
    }

    // POST - Create new workflow
    if (req.method === 'POST') {
      const { name, description, triggerType, triggerConditions, isActive, steps } = req.body;

      if (!name || !triggerType) {
        return res.status(400).json({
          success: false,
          error: 'name and triggerType are required'
        });
      }

      // Create workflow with steps
      const workflow = await prisma.emailWorkflow.create({
        data: {
          name,
          description,
          triggerType,
          triggerConditions: triggerConditions ? JSON.parse(JSON.stringify(triggerConditions)) : null,
          isActive: isActive !== undefined ? isActive : true,
          steps: steps ? {
            create: steps.map((step, index) => ({
              templateId: step.templateId,
              stepOrder: step.stepOrder || (index + 1),
              delayDays: step.delayDays || 0,
              delayHours: step.delayHours || 0,
              delayMinutes: step.delayMinutes || 0,
              conditions: step.conditions ? JSON.parse(JSON.stringify(step.conditions)) : null,
              isActive: step.isActive !== undefined ? step.isActive : true
            }))
          } : undefined
        },
        include: {
          steps: {
            include: {
              template: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: workflow
      });
    }

    // PUT - Update workflow
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Workflow ID is required'
        });
      }

      // Handle JSON fields
      if (updateData.triggerConditions && typeof updateData.triggerConditions === 'object') {
        updateData.triggerConditions = JSON.parse(JSON.stringify(updateData.triggerConditions));
      }

      // Handle steps update separately if provided
      const { steps, ...workflowData } = updateData;

      const workflow = await prisma.emailWorkflow.update({
        where: { id },
        data: workflowData,
        include: {
          steps: {
            include: {
              template: true
            }
          }
        }
      });

      // Update steps if provided
      if (steps) {
        // Delete existing steps
        await prisma.emailWorkflowStep.deleteMany({
          where: { workflowId: id }
        });

        // Create new steps
        await prisma.emailWorkflowStep.createMany({
          data: steps.map((step, index) => ({
            workflowId: id,
            templateId: step.templateId,
            stepOrder: step.stepOrder || (index + 1),
            delayDays: step.delayDays || 0,
            delayHours: step.delayHours || 0,
            delayMinutes: step.delayMinutes || 0,
            conditions: step.conditions ? JSON.parse(JSON.stringify(step.conditions)) : null,
            isActive: step.isActive !== undefined ? step.isActive : true
          }))
        });

        // Fetch updated workflow
        const updatedWorkflow = await prisma.emailWorkflow.findUnique({
          where: { id },
          include: {
            steps: {
              include: {
                template: true
              },
              orderBy: { stepOrder: 'asc' }
            }
          }
        });

        return res.json({
          success: true,
          data: updatedWorkflow
        });
      }

      return res.json({
        success: true,
        data: workflow
      });
    }

    // DELETE - Delete workflow
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Workflow ID is required'
        });
      }

      await prisma.emailWorkflow.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Workflow deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in workflows API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

