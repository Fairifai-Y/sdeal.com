/**
 * Shared Prisma Client for serverless functions
 * This prevents connection pool exhaustion in Vercel
 */

const { PrismaClient } = require('@prisma/client');

// In serverless environments, we need to reuse the Prisma Client
// to avoid exhausting the connection pool
const globalForPrisma = global;

// Create Prisma Client with optimized connection pool settings for serverless
// For Vercel serverless, we need to limit connections and use connection pooling
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Always reuse the same instance in serverless (Vercel keeps the same global between requests)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} else {
  // In production (Vercel), also reuse to prevent connection pool exhaustion
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

module.exports = prisma;

