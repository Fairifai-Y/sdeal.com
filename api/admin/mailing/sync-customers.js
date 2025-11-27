const prisma = require('../../lib/prisma-with-retry');
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

  // Determine store from order
  // First try store_name (most reliable, directly from Magento)
  let store = null;
  if (order.store_name) {
    // Normalize store_name (remove newlines, take first line, trim)
    const normalizedStoreName = order.store_name.split('\n')[0].trim().toUpperCase();
    // Map common store names
    if (normalizedStoreName === 'NL' || normalizedStoreName === 'NETHERLANDS') {
      store = 'NL';
    } else if (normalizedStoreName === 'DE' || normalizedStoreName === 'GERMANY') {
      store = 'DE';
    } else if (normalizedStoreName === 'BE' || normalizedStoreName === 'BELGIUM') {
      store = 'BE';
    } else if (normalizedStoreName === 'FR' || normalizedStoreName === 'FRANCE') {
      store = 'FR';
    } else if (normalizedStoreName === 'EN' || normalizedStoreName === 'ENGLISH' || normalizedStoreName === 'UK') {
      // EN store might map to NL or UK - defaulting to NL for now
      store = 'NL';
    }
  }
  
  // If no store from store_name, try store_id mapping
  if (!store) {
    const storeId = order.store_id || order.storeId;
    store = storeId ? (storeMapping[storeId] || null) : null;
  }
  
  // Final fallback: use country from billing/shipping address
  if (!store) {
    const countryId = order.billing_address?.country_id || 
                      order.shipping_address?.country_id ||
                      order.shipping_countryid || 
                      order.country_id;
    if (countryId) {
      const countryUpper = String(countryId).toUpperCase();
      if (['NL', 'NETHERLANDS'].includes(countryUpper)) store = 'NL';
      else if (['DE', 'GERMANY'].includes(countryUpper)) store = 'DE';
      else if (['BE', 'BELGIUM'].includes(countryUpper)) store = 'BE';
      else if (['FR', 'FRANCE'].includes(countryUpper)) store = 'FR';
    }
  }
  
  // Ultimate fallback
  store = store || 'NL';
  
  const purchaseDate = order.created_at ? new Date(order.created_at) : new Date();

  return {
    firstName,
    lastName,
    email,
    store,
    country: order.billing_address?.country_id || 
             order.shipping_address?.country_id ||
             order.shipping_countryid || 
             order.country_id || 
             order.shipping_country || 
             store,
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
  
  console.log('[Sync] Starting sync...');
  // Note: Database wake-up and retry logic is now handled automatically by prisma-with-retry
  
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
        
        // Process each order (simple pattern like offline script)
        for (let i = 0; i < orders.length; i++) {
          // Check stop flag
          if (syncStatus.shouldStop) {
            console.log('[Sync] Stop requested during processing');
            break;
          }
          
          const order = orders[i];
          const orderId = order.entity_id || order.id || `page${page}-${i + 1}`;
          
          try {
            // Track highest entity_id
            const entityId = order.entity_id || order.id;
            if (entityId && entityId > highestEntityId) {
              highestEntityId = entityId;
            }
            
            // Convert order to consumer data
            const consumerData = convertOrderToConsumer(order, storeMapping);
            
            // Skip orders without email
            if (!consumerData || !consumerData.email) {
              sessionSkipped++;
              continue;
            }
            
            // Try to create consumer directly (more efficient than findFirst + create)
            // If it already exists, we'll catch the unique constraint error
            // Retry logic is now handled automatically by prisma-with-retry
            try {
              const newConsumer = await prisma.consumer.create({
                data: consumerData
              });
              sessionCreated++;
              
              // Execute workflows for newly created consumer (async, don't wait)
              const { executeWorkflowsForConsumer } = require('./execute-workflows');
              executeWorkflowsForConsumer(newConsumer.id).catch(err => {
                console.error('[Sync] Error executing workflows for new consumer:', err);
              });
              
              if ((sessionCreated + totalCreated) % 50 === 0) {
                console.log(`[Sync] ✅ Created ${sessionCreated + totalCreated} customers so far...`);
              }
              
            } catch (error) {
              // Check if it's a unique constraint error (consumer already exists)
              if (error.code === 'P2002' || error.message.includes('Unique constraint') || error.message.includes('duplicate key')) {
                sessionSkipped++;
                // Consumer exists, skip and continue
              } else {
                // Other errors (connection errors are already retried by wrapper)
                throw error;
              }
            }
            
            // Small delay between queries to prevent connection pool exhaustion
            // Delay every 5th query to balance speed and reliability
            if ((i + 1) % 5 === 0) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            syncStatus.progress.totalProcessed++;
            
          } catch (error) {
            console.error(`[Sync] ❌ Order ${orderId}: Error -`, error.message);
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
        console.error(`[Sync] ❌ Error processing page ${page}:`, pageError.message);
        console.error('[Sync] 💾 Checkpoint saved. You can resume later.\n');
        
        // Simple retry for network errors (like offline script)
        if (pageError.message.includes('timeout') || pageError.message.includes('ECONNRESET')) {
          console.log('[Sync] ⏸️  Network error detected. Pausing for 5 seconds before retry...\n');
          await new Promise(resolve => setTimeout(resolve, 5000));
          // Retry same page
          continue;
        } else {
          // For other errors, continue to next page
          sessionErrors++;
          totalErrors += sessionErrors;
          syncStatus.progress.errors = totalErrors;
          syncStatus.errors.push({ page: page, error: pageError.message });
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
