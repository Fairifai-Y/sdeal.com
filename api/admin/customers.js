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
    const allCustomers = await prisma.packageSelection.findMany({
      select: {
        id: true,
        sellerId: true,
        sellerEmail: true,
        companyName: true,
        firstName: true,
        lastName: true,
        package: true,
        billingPeriod: true,
        isNewCustomer: true,
        mollieCustomerId: true,
        mollieMandateId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get statistics
    const totalCustomers = allCustomers.length;
    const newCustomers = allCustomers.filter(c => c.isNewCustomer).length;
    const existingCustomers = totalCustomers - newCustomers;
    const withRecurring = allCustomers.filter(c => c.mollieMandateId !== null).length;

    // Stats by package
    const statsByPackage = {
      A: allCustomers.filter(c => c.package === 'A').length,
      B: allCustomers.filter(c => c.package === 'B').length,
      C: allCustomers.filter(c => c.package === 'C').length
    };

    res.json({
      success: true,
      data: {
        totalCustomers,
        newCustomers,
        existingCustomers,
        withRecurring,
        statsByPackage,
        customers: allCustomers
      }
    });

  } catch (error) {
    console.error('Error fetching customers data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

