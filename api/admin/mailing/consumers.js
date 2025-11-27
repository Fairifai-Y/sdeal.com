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
    // GET - List all consumers with pagination and filters
    if (req.method === 'GET') {
      const { page = 1, pageSize = 50, store, country, isUnsubscribed, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const where = {};
      
      if (store) where.store = store;
      if (country) where.country = country;
      if (isUnsubscribed !== undefined) where.isUnsubscribed = isUnsubscribed === 'true';
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [consumers, total] = await Promise.all([
        prisma.consumer.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                emailEvents: true
              }
            }
          }
        }),
        prisma.consumer.count({ where })
      ]);

      return res.json({
        success: true,
        data: {
          consumers,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize))
          }
        }
      });
    }

    // POST - Create new consumer
    if (req.method === 'POST') {
      const { firstName, lastName, email, store, country, phone, source, sourceUrl, preferences } = req.body;

      if (!firstName || !lastName || !email || !store) {
        return res.status(400).json({
          success: false,
          error: 'firstName, lastName, email, and store are required'
        });
      }

      // Generate unsubscribe token
      const crypto = require('crypto');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      const consumer = await prisma.consumer.create({
        data: {
          firstName,
          lastName,
          email,
          store,
          country: country || store, // Default to store if country not provided
          phone,
          source,
          sourceUrl,
          preferences: preferences ? JSON.parse(JSON.stringify(preferences)) : null,
          unsubscribeToken
        }
      });

      // Execute workflows for newly created consumer (async, don't wait)
      const { executeWorkflowsForConsumer } = require('./execute-workflows');
      executeWorkflowsForConsumer(consumer.id).catch(err => {
        console.error('[Consumers API] Error executing workflows:', err);
      });

      return res.json({
        success: true,
        data: consumer
      });
    }

    // PUT - Update consumer
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Consumer ID is required'
        });
      }

      // Handle preferences JSON
      if (updateData.preferences && typeof updateData.preferences === 'object') {
        updateData.preferences = JSON.parse(JSON.stringify(updateData.preferences));
      }

      const consumer = await prisma.consumer.update({
        where: { id },
        data: updateData
      });

      return res.json({
        success: true,
        data: consumer
      });
    }

    // DELETE - Delete consumer
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Consumer ID is required'
        });
      }

      await prisma.consumer.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Consumer deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in consumers API:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

