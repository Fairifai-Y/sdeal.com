const prisma = require('../../lib/prisma');
const { makeRequest: makeMagentoRequest } = require('../../magento/helpers');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Checkpoint file location
const CHECKPOINT_FILE = path.join(__dirname, '../../../server/sync-checkpoint.json');

// In-memory sync status and stop flag
const syncStatus = {
  isRunning: false,
  shouldStop: false,
  progress: {
    totalProcessed: 0,
    totalCreated: 0,
    totalSkipped: 0,
    totalErrors: 0,
    currentPage: 0,
    lastEntityId: 0
  },
  errors: [],
  startedAt: null,
  completedAt: null
};

// Store mapping
const storeMapping = {
  1: 'NL',
  2: 'DE',
  3: 'BE',
  4: 'FR'
};

/**
 * Convert Magento order to consumer data
 */
function convertOrderToConsumer(order, storeMapping = {}) {
  const email = order.customer_email || 
               order.customerEmail || 
               order.email ||
               (order.billing_address?.email) ||
               (order.shipping_address?.email);
  
  if (!email || !email.includes('@')) {
    return null;
  }

  let firstName = order.customer_firstname || 
                 order.first_name || 
                 (order.billing_address?.firstname) || '';
  let lastName = order.customer_lastname || 
                order.last_name || 
                (order.billing_address?.lastname) || '';
  
  if (!firstName && !lastName && order.customer_name && !order.customer_name.includes('@')) {
    const nameParts = order.customer_name.trim().split(/\s+/);
    if (nameParts.length > 0) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || '';
    }
  }
  
  if (!firstName && !lastName) {
    const emailPrefix = email.split('@')[0];
    firstName = emailPrefix || 'Unknown';
    lastName = 'Customer';
  }

  const storeId = order.store_id || order.storeId || 1;
  const store = storeMapping[storeId] || 'NL';
  const purchaseDate = order.created_at ? new Date(order.created_at) : new Date();

  return {
    firstName,
    lastName,
    email,
    store,
    country: order.shipping_countryid || order.country_id || order.shipping_country || store,
    phone: order.customer_phone || order.telephone || order.phone || null,
    purchaseDate,
    source: 'magento_sync',
    sourceUrl: null,
    unsubscribeToken: crypto.randomBytes(32).toString('hex')
  };
}

/**
 * Load checkpoint from file
 */
function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('[Sync] Could not load checkpoint:', error.message);
  }
  return null;
}

/**
 * Save checkpoint to file
 */
function saveCheckpoint(checkpoint) {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    console.error('[Sync] Could not save checkpoint:', error.message);
  }
}

/**
 * Clear checkpoint file
 */
function clearCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }
  } catch (error) {
    // Ignore
  }
}

/**
 * Main sync function with checkpoint support
 */
async function syncOrders(options = {}) {
  const {
    pageSize = 500,
    startPage = 1,
    maxPages = null,
    resume = true,
    fullSync = false
  } = options;
  
  // Load checkpoint if resuming
  let checkpoint = null;
  if (resume && !fullSync) {
    checkpoint = loadCheckpoint();
    if (checkpoint) {
      console.log('[Sync] Resuming from checkpoint:', checkpoint.lastPage);
    }
  }
  
  const currentPage = checkpoint ? checkpoint.lastPage + 1 : startPage;
  const lastEntityId = checkpoint ? checkpoint.lastEntityId : 0;
  
  syncStatus.isRunning = true;
  syncStatus.shouldStop = false;
  syncStatus.startedAt = new Date();
  
  // Wake up database if it's sleeping (Neon serverless databases sleep after inactivity)
  console.log('[Sync] Testing database connection...');
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[Sync] ✅ Database connection OK');
  } catch (wakeError) {
    console.warn('[Sync] ⚠️ Database might be sleeping, attempting to wake up...');
    // Retry a few times with increasing delays
    let wakeRetries = 0;
    let wokeUp = false;
    while (wakeRetries < 5 && !wokeUp) {
      await new Promise(resolve => setTimeout(resolve, 2000 * (wakeRetries + 1))); // 2s, 4s, 6s, 8s, 10s
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log(`[Sync] ✅ Database woke up after ${wakeRetries + 1} attempt(s)`);
        wokeUp = true;
      } catch (retryError) {
        wakeRetries++;
        if (wakeRetries >= 5) {
          console.error('[Sync] ❌ Could not wake up database after 5 attempts. Please check your DATABASE_URL and Neon dashboard.');
          throw new Error('Database unreachable. Please check your connection and try again.');
        }
      }
    }
  }
  
  // Initialize totals from checkpoint or zero
  let totalCreated = checkpoint ? checkpoint.totalCreated : 0;
  let totalSkipped = checkpoint ? checkpoint.totalSkipped : 0;
  let totalErrors = checkpoint ? checkpoint.totalErrors : 0;
  
  syncStatus.progress = {
    totalProcessed: 0,
    totalCreated: totalCreated,
    totalSkipped: totalSkipped,
    totalErrors: totalErrors,
    currentPage: currentPage - 1,
    lastEntityId: lastEntityId
  };
  syncStatus.errors = [];
  
  let page = currentPage;
  let hasMore = true;
  let sessionCreated = 0;
  let sessionSkipped = 0;
  let sessionErrors = 0;
  let highestEntityId = lastEntityId;
  
  try {
    while (hasMore && (!maxPages || page <= startPage + maxPages - 1)) {
      // Check if we should stop
      if (syncStatus.shouldStop) {
        console.log('[Sync] Stop requested by user');
        break;
      }
      
      try {
        syncStatus.progress.currentPage = page;
        console.log(`[Sync] Fetching page ${page}...`);
        const pageStartTime = Date.now();
        
        let ordersData;
        try {
          ordersData = await makeMagentoRequest('/orders', {
            'searchCriteria[pageSize]': pageSize,
            'searchCriteria[currentPage]': page
          });
        } catch (requestError) {
          const requestDuration = Date.now() - pageStartTime;
          console.error(`[Sync] ❌ Error fetching page ${page} after ${requestDuration}ms:`, requestError.message);
          console.error(`[Sync] Error type:`, requestError.constructor.name);
          throw requestError; // Re-throw to trigger retry logic
        }
        
        const fetchDuration = Date.now() - pageStartTime;
        console.log(`[Sync] ✅ Page ${page} fetched successfully in ${fetchDuration}ms`);
        
        const orders = ordersData?.items || [];
        
        if (orders.length === 0) {
          console.log(`[Sync] No more orders at page ${page}`);
          hasMore = false;
          break;
        }
        
        console.log(`[Sync] Processing ${orders.length} orders from page ${page}...`);
        
        // Process each order with retry logic for connection pool errors
        for (let i = 0; i < orders.length; i++) {
          // Check stop flag
          if (syncStatus.shouldStop) {
            console.log('[Sync] Stop requested during processing');
            break;
          }
          
          const order = orders[i];
          
          // Add small delay between orders to prevent connection pool exhaustion
          if (i > 0 && i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay every 10 orders
          }
          
          try {
            const entityId = order.entity_id || order.id;
            if (entityId && entityId > highestEntityId) {
              highestEntityId = entityId;
            }
            
            const consumerData = convertOrderToConsumer(order, storeMapping);
            
            if (!consumerData || !consumerData.email) {
              sessionSkipped++;
              continue;
            }
            
            // Retry logic for connection pool errors
            let retryCount = 0;
            const maxRetries = 3;
            let success = false;
            
            while (retryCount < maxRetries && !success) {
              try {
                const existingConsumer = await prisma.consumer.findFirst({
                  where: { email: consumerData.email }
                });
                
                if (!existingConsumer) {
                  await prisma.consumer.create({ data: consumerData });
                  sessionCreated++;
                } else {
                  sessionSkipped++;
                }
                
                syncStatus.progress.totalProcessed++;
                success = true;
                
              } catch (dbError) {
                const isConnectionPoolError = dbError.message.includes('connection pool') || 
                                            dbError.message.includes('Timed out fetching');
                const isDatabaseUnreachable = dbError.message.includes("Can't reach database server") ||
                                            dbError.message.includes('ENOTFOUND') ||
                                            dbError.message.includes('ECONNREFUSED') ||
                                            dbError.message.includes('ETIMEDOUT');
                
                if ((isConnectionPoolError || isDatabaseUnreachable) && retryCount < maxRetries - 1) {
                  retryCount++;
                  
                  // Longer delay for database unreachable (Neon might be sleeping)
                  let backoffDelay;
                  if (isDatabaseUnreachable) {
                    backoffDelay = Math.min(5000 * retryCount, 30000); // 5s, 10s, max 30s for sleeping database
                    console.warn(`[Sync] Database unreachable for order ${entityId} (Neon might be sleeping), retry ${retryCount}/${maxRetries} after ${backoffDelay}ms...`);
                    
                    // Try to wake up the database with a simple query
                    try {
                      await prisma.$queryRaw`SELECT 1`;
                      console.log(`[Sync] Database connection test successful, continuing...`);
                    } catch (wakeError) {
                      console.warn(`[Sync] Database still unreachable, waiting ${backoffDelay}ms...`);
                    }
                  } else {
                    backoffDelay = Math.min(2000 * retryCount, 10000); // 2s, 4s, max 10s for pool errors
                    console.warn(`[Sync] Connection pool error for order ${entityId}, retry ${retryCount}/${maxRetries} after ${backoffDelay}ms...`);
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, backoffDelay));
                  // Continue to retry (don't disconnect - we reuse the same client)
                } else {
                  // Not a retryable error, or max retries reached
                  throw dbError;
                }
              }
            }
            
          } catch (error) {
            console.error(`[Sync] Error processing order ${order.entity_id || order.id || 'unknown'}:`, error.message);
            sessionErrors++;
            syncStatus.errors.push({
              orderId: order.entity_id || order.id || 'unknown',
              error: error.message
            });
          }
        }
        
        // Update totals
        const newTotalCreated = totalCreated + sessionCreated;
        const newTotalSkipped = totalSkipped + sessionSkipped;
        const newTotalErrors = totalErrors + sessionErrors;
        
        syncStatus.progress.totalCreated = newTotalCreated;
        syncStatus.progress.totalSkipped = newTotalSkipped;
        syncStatus.progress.totalErrors = newTotalErrors;
        syncStatus.progress.lastEntityId = highestEntityId;
        
        // Save checkpoint after each page
        const checkpoint = {
          lastPage: page,
          lastEntityId: highestEntityId,
          totalCreated: newTotalCreated,
          totalSkipped: newTotalSkipped,
          totalErrors: newTotalErrors,
          lastUpdated: new Date().toISOString()
        };
        saveCheckpoint(checkpoint);
        
        console.log(`[Sync] Page ${page} completed: ${sessionCreated} created, ${sessionSkipped} skipped, ${sessionErrors} errors`);
        
        // Reset session counters
        sessionCreated = 0;
        sessionSkipped = 0;
        sessionErrors = 0;
        
        if (orders.length < pageSize) {
          hasMore = false;
          break;
        }
        
        page++;
        
        // Small delay between pages
        if (hasMore && !syncStatus.shouldStop) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (pageError) {
        console.error(`[Sync] Error processing page ${page}:`, pageError.message);
        
        // Check if it's a network/timeout error that we should retry
        const isNetworkError = pageError.message.includes('timeout') || 
                              pageError.message.includes('ECONNRESET') ||
                              pageError.message.includes('ETIMEDOUT') ||
                              pageError.message.includes('ENOTFOUND') ||
                              pageError.message.includes('Proxy request timeout');
        
        if (isNetworkError) {
          // Retry with exponential backoff (max 3 retries per page)
          const maxRetries = 3;
          let retryCount = 0;
          let retrySuccess = false;
          
          while (retryCount < maxRetries && !retrySuccess && !syncStatus.shouldStop) {
            retryCount++;
            const backoffDelay = Math.min(5000 * Math.pow(2, retryCount - 1), 30000); // 5s, 10s, 20s, max 30s
            console.log(`[Sync] Network error on page ${page}, retry ${retryCount}/${maxRetries} after ${backoffDelay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            
            try {
              // Retry fetching the same page
              const retryOrdersData = await makeMagentoRequest('/orders', {
                'searchCriteria[pageSize]': pageSize,
                'searchCriteria[currentPage]': page
              });
              
              const retryOrders = retryOrdersData?.items || [];
              console.log(`[Sync] Retry successful! Received ${retryOrders.length} orders`);
              
              // Process retried orders
              for (const order of retryOrders) {
                if (syncStatus.shouldStop) break;
                
                try {
                  const entityId = order.entity_id || order.id;
                  if (entityId && entityId > highestEntityId) {
                    highestEntityId = entityId;
                  }
                  
                  const consumerData = convertOrderToConsumer(order, storeMapping);
                  if (!consumerData || !consumerData.email) {
                    sessionSkipped++;
                    continue;
                  }
                  
                  const existingConsumer = await prisma.consumer.findFirst({
                    where: { email: consumerData.email }
                  });
                  
                  if (!existingConsumer) {
                    await prisma.consumer.create({ data: consumerData });
                    sessionCreated++;
                    syncStatus.progress.totalProcessed++;
                  } else {
                    sessionSkipped++;
                  }
                } catch (orderError) {
                  console.error(`[Sync] Error processing order in retry:`, orderError.message);
                  sessionErrors++;
                }
              }
              
              // Update totals after successful retry
              const newTotalCreated = totalCreated + sessionCreated;
              const newTotalSkipped = totalSkipped + sessionSkipped;
              const newTotalErrors = totalErrors + sessionErrors;
              
              totalCreated = newTotalCreated;
              totalSkipped = newTotalSkipped;
              totalErrors = newTotalErrors;
              
              syncStatus.progress.totalCreated = newTotalCreated;
              syncStatus.progress.totalSkipped = newTotalSkipped;
              syncStatus.progress.totalErrors = newTotalErrors;
              syncStatus.progress.lastEntityId = highestEntityId;
              
              // Save checkpoint after successful retry
              const checkpoint = {
                lastPage: page,
                lastEntityId: highestEntityId,
                totalCreated: newTotalCreated,
                totalSkipped: newTotalSkipped,
                totalErrors: newTotalErrors,
                lastUpdated: new Date().toISOString()
              };
              saveCheckpoint(checkpoint);
              
              console.log(`[Sync] Page ${page} completed after retry: ${sessionCreated} created, ${sessionSkipped} skipped, ${sessionErrors} errors`);
              
              // Reset session counters
              sessionCreated = 0;
              sessionSkipped = 0;
              sessionErrors = 0;
              
              retrySuccess = true;
              // Continue to next page after successful retry
              if (retryOrders.length < pageSize) {
                hasMore = false;
              }
              page++;
              break;
              
            } catch (retryError) {
              console.error(`[Sync] Retry ${retryCount} failed:`, retryError.message);
              if (retryCount >= maxRetries) {
                console.error(`[Sync] Max retries reached for page ${page}, skipping...`);
                sessionErrors++;
                syncStatus.progress.totalErrors++;
                page++; // Skip to next page after max retries
              }
            }
          }
          
          if (!retrySuccess) {
            // All retries failed, but we already incremented page
            continue;
          }
        } else {
          // Non-network error, skip this page
          console.error(`[Sync] Non-network error on page ${page}, skipping...`);
          sessionErrors++;
          syncStatus.progress.totalErrors++;
          page++;
        }
      }
    }
    
    syncStatus.completedAt = new Date();
    
    // Clear checkpoint if completed successfully
    if (!syncStatus.shouldStop && hasMore === false) {
      clearCheckpoint();
      console.log('[Sync] ✅ Completed successfully');
    } else if (syncStatus.shouldStop) {
      console.log('[Sync] ⏸️  Stopped by user');
    } else {
      console.log('[Sync] ⏸️  Paused (max pages reached)');
    }
    
    return syncStatus.progress;
    
  } catch (error) {
    console.error('[Sync] Fatal error:', error);
    syncStatus.errors.push({
      fatal: true,
      error: error.message
    });
    throw error;
  } finally {
    syncStatus.isRunning = false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get sync status
    if (req.method === 'GET') {
      try {
        // Load checkpoint for additional info
        const checkpoint = loadCheckpoint();
        
        return res.json({
          success: true,
          data: {
            ...syncStatus,
            checkpoint: checkpoint,
            duration: syncStatus.startedAt ? 
              (syncStatus.completedAt || new Date()) - syncStatus.startedAt : null
          }
        });
      } catch (error) {
        console.error('[Sync API] Error in GET handler:', error);
        return res.status(500).json({
          success: false,
          error: error.message || 'Internal server error'
        });
      }
    }

    // POST - Start sync
    if (req.method === 'POST') {
      if (syncStatus.isRunning) {
        return res.status(400).json({
          success: false,
          error: 'Sync is already running'
        });
      }

      const {
        pageSize = 500,
        startPage = 1,
        maxPages = null,
        fullSync = false,
        resume = true
      } = req.body;

      console.log(`[Sync] Starting sync (pageSize: ${pageSize}, startPage: ${startPage}, maxPages: ${maxPages || 'unlimited'}, fullSync: ${fullSync})`);

      // Start sync in background
      syncOrders({
        pageSize: parseInt(pageSize),
        startPage: parseInt(startPage),
        maxPages: maxPages ? parseInt(maxPages) : null,
        fullSync: fullSync,
        resume: resume
      }).catch(error => {
        console.error('[Sync] Background sync error:', error);
        syncStatus.isRunning = false;
      });

      return res.json({
        success: true,
        message: 'Sync started',
        data: {
          status: 'started'
        }
      });
    }

    // DELETE - Stop sync
    if (req.method === 'DELETE') {
      if (!syncStatus.isRunning) {
        return res.status(400).json({
          success: false,
          error: 'Sync is not running'
        });
      }

      syncStatus.shouldStop = true;
      console.log('[Sync] Stop requested');

      return res.json({
        success: true,
        message: 'Stop requested. Sync will stop after current page.',
        data: {
          status: 'stopping'
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('[Sync API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
