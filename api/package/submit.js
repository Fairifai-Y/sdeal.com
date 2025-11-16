// For Vercel, Prisma Client needs to be generated from prisma/schema.prisma
// The Prisma Client should be generated during build
const { PrismaClient } = require('@prisma/client');

// Use a singleton pattern for Prisma Client in serverless functions
// This prevents creating multiple connections in serverless environments
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

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

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const {
      package: packageType,
      addons,
      agreementAccepted,
      language,
      sellerEmail,
      sellerId: sellerIdParam,
      startDate,
      commissionPercentage,
      billingPeriod
    } = req.body;

    // Validation
    if (!packageType || !['A', 'B', 'C'].includes(packageType)) {
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

    const sellerId = sellerIdParam || '';
    
    if (!sellerId || sellerId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Seller ID is required.'
      });
    }

    if (!startDate || !['immediate', '2026-01-01'].includes(startDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start date. Must be "immediate" or "2026-01-01".'
      });
    }

    // Validate commission percentage based on package
    if (packageType === 'B' || packageType === 'C') {
      if (!commissionPercentage || isNaN(parseFloat(commissionPercentage)) || parseFloat(commissionPercentage) < 4) {
        return res.status(400).json({
          success: false,
          error: `Commission percentage must be at least 4% for Package ${packageType}.`
        });
      }
    } else if (packageType === 'A' && commissionPercentage) {
      if (isNaN(parseFloat(commissionPercentage)) || parseFloat(commissionPercentage) < 12) {
        return res.status(400).json({
          success: false,
          error: 'Commission percentage must be at least 12% for Package A.'
        });
      }
    }

    // Get IP address
    const ipAddress = getClientIP(req);

    // Create package selection record
    const packageSelection = await prisma.packageSelection.create({
      data: {
        package: packageType,
        addonDealCSS: addons?.dealCSS || false,
        addonCAAS: addons?.caas || false,
        addonFairifAI: addons?.fairifAI || false,
        agreementAccepted,
        language,
        ipAddress,
        sellerEmail: sellerEmail || null,
        sellerId: sellerId.trim(),
        startDate: startDate,
        commissionPercentage: commissionPercentage ? parseFloat(commissionPercentage) : null,
        billingPeriod: billingPeriod || 'monthly'
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
  // Note: Don't disconnect Prisma in serverless functions to allow connection reuse
};

