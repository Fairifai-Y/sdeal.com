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
// Custom error handler to filter out "Closed" connection errors
// These are normal in serverless environments and are automatically handled by the retry wrapper
const shouldLogError = (error) => {
  if (!error) return true;
  
  const errorString = JSON.stringify(error);
  const errorMessage = error.message || '';
  
  // Filter out "Closed" connection errors - these are handled by retry wrapper
  const isClosedError = (
    errorMessage.includes('Closed') ||
    errorString.includes('"kind":"Closed"') ||
    errorString.includes('kind: Closed') ||
    errorMessage.includes('connection closed') ||
    errorMessage.includes('Connection closed')
  );
  
  return !isClosedError;
};

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: [
    // Use event-based logging to filter errors
    { emit: 'event', level: 'error' },
    ...(process.env.NODE_ENV === 'development' ? [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'warn' }
    ] : [])
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings (these are hints, actual pool is managed by Neon pooler)
  // For Neon pooler, connection_limit and pool_timeout are set via connection string
  // Add ?connection_limit=10&pool_timeout=20 to DATABASE_URL if needed
  errorFormat: 'minimal'
});

// Attach error handler to filter out "Closed" connection errors
prisma.$on('error', (e) => {
  if (shouldLogError(e)) {
    console.error('prisma:error', e);
  }
  // "Closed" errors are silently handled by the retry wrapper
});

// Attach other log handlers
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('prisma:query', e);
  });
  prisma.$on('warn', (e) => {
    console.warn('prisma:warn', e);
  });
}

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

