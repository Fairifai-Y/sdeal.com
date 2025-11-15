const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get client IP address
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

// Submit package selection
router.post('/submit', async (req, res) => {
  try {
    const {
      package,
      addons,
      agreementAccepted,
      language,
      sellerEmail,
      sellerId
    } = req.body;

    // Validation
    if (!package || !['A', 'B', 'C'].includes(package)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid package selection. Must be A, B, or C.'
      });
    }

    if (!agreementAccepted) {
      return res.status(400).json({
        success: false,
        error: 'Agreement must be accepted.'
      });
    }

    if (!language || !['en', 'nl', 'de', 'fr'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language. Must be en, nl, de, or fr.'
      });
    }

    // Get IP address
    const ipAddress = getClientIP(req);

    // Create package selection record
    const packageSelection = await prisma.packageSelection.create({
      data: {
        package,
        addonDealCSS: addons?.dealCSS || false,
        addonCAAS: addons?.caas || false,
        addonFairifAI: addons?.fairifAI || false,
        agreementAccepted,
        language,
        ipAddress,
        sellerEmail: sellerEmail || null,
        sellerId: sellerId || null
      }
    });

    // TODO: Send confirmation email here
    // You can use nodemailer or another email service

    res.json({
      success: true,
      message: 'Package selection saved successfully',
      data: {
        id: packageSelection.id,
        package: packageSelection.package,
        createdAt: packageSelection.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving package selection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save package selection',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all package selections (for admin)
router.get('/all', async (req, res) => {
  try {
    // TODO: Add authentication/authorization here
    // For now, this is open - you should protect this route

    const { page = 1, limit = 50, package: packageFilter, language: languageFilter } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (packageFilter) where.package = packageFilter;
    if (languageFilter) where.language = languageFilter;

    const [selections, total] = await Promise.all([
      prisma.packageSelection.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.packageSelection.count({ where })
    ]);

    res.json({
      success: true,
      data: selections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching package selections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch package selections',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const [total, byPackage, byLanguage, recent] = await Promise.all([
      prisma.packageSelection.count(),
      prisma.packageSelection.groupBy({
        by: ['package'],
        _count: true
      }),
      prisma.packageSelection.groupBy({
        by: ['language'],
        _count: true
      }),
      prisma.packageSelection.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          package: true,
          language: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byPackage: byPackage.reduce((acc, item) => {
          acc[item.package] = item._count;
          return acc;
        }, {}),
        byLanguage: byLanguage.reduce((acc, item) => {
          acc[item.language] = item._count;
          return acc;
        }, {}),
        recent
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

