/**
 * Shared Prisma Client for serverless functions
 * This prevents connection pool exhaustion in Vercel
 */

// Load .env file for local development (Vercel uses environment variables automatically)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available, that's okay - Vercel will use environment variables
  }
}

const { PrismaClient } = require('@prisma/client');

// In serverless environments, we need to reuse the Prisma Client
// to avoid exhausting the connection pool
const globalForPrisma = global;

// Create Prisma Client with optimized connection pool settings for serverless
// For Vercel serverless, we need to limit connections and use connection pooling
// For Neon, use the pooler URL (ends with -pooler) for better serverless performance
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
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

