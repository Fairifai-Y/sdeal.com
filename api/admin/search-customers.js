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
    const searchQuery = req.query.q || '';
    
    // If no search query, return all customers
    if (!searchQuery || searchQuery.trim() === '') {
      const allCustomers = await prisma.packageSelection.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.json({
        success: true,
        data: allCustomers
      });
    }

    // Search across all text fields using OR conditions
    const searchTerm = `%${searchQuery.trim()}%`;
    
    // Use Prisma's OR condition to search across multiple fields
    const customers = await prisma.packageSelection.findMany({
      where: {
        OR: [
          { sellerId: { contains: searchQuery, mode: 'insensitive' } },
          { sellerEmail: { contains: searchQuery, mode: 'insensitive' } },
          { companyName: { contains: searchQuery, mode: 'insensitive' } },
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } },
          { street: { contains: searchQuery, mode: 'insensitive' } },
          { city: { contains: searchQuery, mode: 'insensitive' } },
          { postalCode: { contains: searchQuery, mode: 'insensitive' } },
          { country: { contains: searchQuery, mode: 'insensitive' } },
          { phone: { contains: searchQuery, mode: 'insensitive' } },
          { kvkNumber: { contains: searchQuery, mode: 'insensitive' } },
          { vatNumber: { contains: searchQuery, mode: 'insensitive' } },
          { iban: { contains: searchQuery, mode: 'insensitive' } },
          { bic: { contains: searchQuery, mode: 'insensitive' } },
          { molliePaymentId: { contains: searchQuery, mode: 'insensitive' } },
          { mollieCustomerId: { contains: searchQuery, mode: 'insensitive' } },
          { mollieMandateId: { contains: searchQuery, mode: 'insensitive' } },
          { ipAddress: { contains: searchQuery, mode: 'insensitive' } },
          { package: { contains: searchQuery, mode: 'insensitive' } },
          { language: { contains: searchQuery, mode: 'insensitive' } },
          { startDate: { contains: searchQuery, mode: 'insensitive' } },
          { billingPeriod: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: customers,
      count: customers.length
    });

  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search customers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

