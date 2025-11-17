const { PrismaClient } = require('@prisma/client');

// Use a singleton pattern for Prisma Client in serverless functions
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    // Get all package selections
    const allSelections = await prisma.packageSelection.findMany({
      select: {
        id: true,
        package: true,
        billingPeriod: true,
        isNewCustomer: true,
        mollieMandateId: true,
        createdAt: true
      }
    });

    // Calculate statistics
    const totalCustomers = allSelections.length;
    const newCustomers = allSelections.filter(s => s.isNewCustomer).length;
    const existingCustomers = totalCustomers - newCustomers;
    const withRecurring = allSelections.filter(s => s.mollieMandateId !== null).length;

    // Stats by package
    const statsByPackage = {
      A: allSelections.filter(s => s.package === 'A').length,
      B: allSelections.filter(s => s.package === 'B').length,
      C: allSelections.filter(s => s.package === 'C').length
    };

    // Stats by billing period
    const statsByBilling = {
      monthly: allSelections.filter(s => s.billingPeriod === 'monthly').length,
      yearly: allSelections.filter(s => s.billingPeriod === 'yearly').length
    };

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = allSelections.filter(s => 
      new Date(s.createdAt) >= sevenDaysAgo
    ).length;

    res.json({
      success: true,
      data: {
        totalCustomers,
        newCustomers,
        existingCustomers,
        withRecurring,
        statsByPackage,
        statsByBilling,
        recentRegistrations
      }
    });

  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

