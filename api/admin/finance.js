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
    // Get all package selections with Mollie recurring payments
    const customersWithRecurring = await prisma.packageSelection.findMany({
      where: {
        mollieMandateId: {
          not: null
        }
      },
      select: {
        id: true,
        sellerId: true,
        sellerEmail: true,
        companyName: true,
        firstName: true,
        lastName: true,
        package: true,
        billingPeriod: true,
        mollieCustomerId: true,
        mollieMandateId: true,
        molliePaymentId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count
    const totalWithRecurring = customersWithRecurring.length;

    // Get statistics by package
    const statsByPackage = {
      A: customersWithRecurring.filter(c => c.package === 'A').length,
      B: customersWithRecurring.filter(c => c.package === 'B').length,
      C: customersWithRecurring.filter(c => c.package === 'C').length
    };

    // Get statistics by billing period
    const statsByBilling = {
      monthly: customersWithRecurring.filter(c => c.billingPeriod === 'monthly').length,
      yearly: customersWithRecurring.filter(c => c.billingPeriod === 'yearly').length
    };

    // Calculate total monthly revenue (estimate)
    const packagePrices = {
      'A': 29.00,
      'B': 49.00,
      'C': 99.00
    };

    let totalMonthlyRevenue = 0;
    customersWithRecurring.forEach(customer => {
      const basePrice = packagePrices[customer.package] || 0;
      if (customer.billingPeriod === 'yearly') {
        // Yearly: divide by 12 and apply 30% discount
        totalMonthlyRevenue += (basePrice * 12 * 0.7) / 12;
      } else {
        totalMonthlyRevenue += basePrice;
      }
    });

    res.json({
      success: true,
      data: {
        totalWithRecurring,
        customers: customersWithRecurring,
        statsByPackage,
        statsByBilling,
        totalMonthlyRevenue: totalMonthlyRevenue.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error fetching finance data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch finance data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

