/**
 * Prisma Client with automatic retry logic for connection pool errors
 * 
 * This wrapper automatically retries database operations when connection pool
 * errors occur, preventing timeouts in serverless environments.
 * 
 * Usage:
 *   const prisma = require('./lib/prisma-with-retry');
 *   const consumer = await prisma.consumer.findFirst({ where: { email: '...' } });
 */

const originalPrisma = require('./prisma');

// Helper function to check if an error is a connection-related error
function isConnectionError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  const errorCode = error.code || '';
  const errorString = JSON.stringify(error);
  
  // Check for "Closed" connection errors (common in serverless databases like Neon)
  const isClosedError = (
    errorMessage.includes('Closed') ||
    errorString.includes('"kind":"Closed"') ||
    errorString.includes('kind: Closed') ||
    errorMessage.includes('connection closed') ||
    errorMessage.includes('Connection closed')
  );
  
  return (
    isClosedError ||
    errorMessage.includes('Timed out fetching a new connection') ||
    errorMessage.includes("Can't reach database server") ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('connection pool') ||
    errorCode === 'P1001' || // Prisma connection error
    errorCode === 'P2024' || // Prisma timeout error
    errorCode === 'P1017'    // Prisma server closed connection
  );
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  delays: [1000, 2000, 4000], // Exponential backoff: 1s, 2s, 4s
  wakeUpQuery: true // Try to wake up database before retry
};

/**
 * Retry a database operation with exponential backoff
 */
async function retryOperation(operation, context = '') {
  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRetryable = isConnectionError(error);
      
      if (!isRetryable || attempt === RETRY_CONFIG.maxRetries - 1) {
        // Not a connection error or last attempt - throw immediately
        throw error;
      }
      
      // Connection error - retry with exponential backoff
      const delay = RETRY_CONFIG.delays[attempt] || RETRY_CONFIG.delays[RETRY_CONFIG.delays.length - 1];
      
      // Check if this is a "Closed" connection error (common in serverless, reduce log spam)
      const isClosedError = error.message?.includes('Closed') || 
                           JSON.stringify(error).includes('"kind":"Closed"') ||
                           JSON.stringify(error).includes('kind: Closed');
      
      // Only log in development or if it's not a "Closed" error (to reduce log spam)
      const shouldLog = process.env.NODE_ENV === 'development' || !isClosedError;
      
      if (context && shouldLog) {
        console.log(`[Prisma Retry] ${context} - Connection error, retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})...`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // For "Closed" errors, try to disconnect and reconnect on first retry
      if (isClosedError && attempt === 0) {
        try {
          // Force disconnect to clear the closed connection
          await originalPrisma.$disconnect().catch(() => {
            // Ignore disconnect errors
          });
          // Small delay to allow disconnect to complete
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
      }
      
      // Try to wake up the database before retry
      if (RETRY_CONFIG.wakeUpQuery) {
        try {
          await originalPrisma.$queryRaw`SELECT 1`.catch(() => {
            // Ignore wake-up errors, the retry will handle reconnection
          });
        } catch (wakeError) {
          // Ignore wake-up errors, continue with retry
        }
      }
    }
  }
}

/**
 * Wrap a Prisma model delegate with retry logic
 */
function wrapModelDelegate(delegate) {
  const wrapped = {};
  
  // Wrap all async methods
  const methodsToWrap = [
    'findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow',
    'create', 'createMany', 'update', 'updateMany', 'upsert',
    'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'
  ];
  
  methodsToWrap.forEach(method => {
    if (typeof delegate[method] === 'function') {
      wrapped[method] = function(...args) {
        // Get model name from the delegate if possible
        const modelName = delegate._modelName || 'Model';
        const context = `${modelName}.${method}`;
        return retryOperation(() => delegate[method].apply(delegate, args), context);
      };
    }
  });
  
  return new Proxy(delegate, {
    get(target, prop) {
      // If we have a wrapped method, use it
      if (wrapped[prop]) {
        return wrapped[prop];
      }
      // Otherwise, return the original
      return target[prop];
    }
  });
}

/**
 * Create a wrapped Prisma client with automatic retry logic
 */
const prismaWithRetry = new Proxy(originalPrisma, {
  get(target, prop) {
    const original = target[prop];
    
    // If it's a model delegate (like consumer, emailCampaign, etc.), wrap it
    if (prop && typeof original === 'object' && original !== null) {
      // Check if it's a model delegate by checking for common Prisma methods
      if (typeof original.findMany === 'function' || 
          typeof original.findFirst === 'function' || 
          typeof original.create === 'function') {
        return wrapModelDelegate(original);
      }
    }
    
    // If it's a $ method (like $queryRaw, $executeRaw, $transaction, etc.), wrap it
    if (typeof original === 'function' && prop.startsWith('$')) {
      return function(...args) {
        const context = `prisma.${prop}`;
        return retryOperation(() => original.apply(target, args), context);
      };
    }
    
    // For everything else, return as-is
    return original;
  }
});

module.exports = prismaWithRetry;

