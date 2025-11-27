const prisma = require('../../lib/prisma-with-retry');
const { makeRequest: makeMagentoRequest } = require('../../magento/helpers');
const { executeWorkflowsForConsumer } = require('./execute-workflows');

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
  let store = null;
  if (order.store_name) {
    const normalizedStoreName = order.store_name.split('\n')[0].trim().toUpperCase();
    if (normalizedStoreName === 'NL' || normalizedStoreName === 'NETHERLANDS') store = 'NL';
    else if (normalizedStoreName === 'DE' || normalizedStoreName === 'GERMANY') store = 'DE';
    else if (normalizedStoreName === 'BE' || normalizedStoreName === 'BELGIUM') store = 'BE';
    else if (normalizedStoreName === 'FR' || normalizedStoreName === 'FRANCE') store = 'FR';
    else if (normalizedStoreName === 'EN' || normalizedStoreName === 'ENGLISH' || normalizedStoreName === 'UK') store = 'NL';
  }
  
  if (!store) {
    const storeId = order.store_id || order.storeId;
    store = storeId ? (storeMapping[storeId] || null) : null;
  }
  
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
  
  store = store || 'NL';
  const country = order.billing_address?.country_id || 
                  order.shipping_address?.country_id ||
                  order.shipping_countryid ||
                  order.country_id ||
                  order.shipping_country ||
                  store;

  const purchaseDate = order.created_at || order.createdAt || new Date();

  return {
    firstName,
    lastName,
    email,
    store,
    country: country || store,
    purchaseDate: new Date(purchaseDate),
    source: 'magento_sync',
    sourceUrl: null
  };
}

/**
 * Incremental sync: Only sync new orders since last sync
 */
async function incrementalSync() {
  console.log('[Incremental Sync] Starting incremental sync...');
  
  try {
    // Get or create SyncStatus for incremental sync
    let syncStatus = await prisma.syncStatus.findUnique({
      where: { syncType: 'incremental' }
    });

    if (!syncStatus) {
      // First time incremental sync - create record
      syncStatus = await prisma.syncStatus.create({
        data: {
          syncType: 'incremental',
          lastEntityId: 0,
          status: 'running',
          totalProcessed: 0,
          totalCreated: 0,
          totalErrors: 0
        }
      });
      console.log('[Incremental Sync] Created new SyncStatus record');
    } else {
      // Update status to running
      await prisma.syncStatus.update({
        where: { id: syncStatus.id },
        data: { status: 'running' }
      });
    }

    const lastEntityId = syncStatus.lastEntityId || 0;
    console.log(`[Incremental Sync] Last synced entity_id: ${lastEntityId}`);
    console.log(`[Incremental Sync] Will sync orders with entity_id > ${lastEntityId}`);

    let page = 1;
    let hasMore = true;
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let highestEntityId = lastEntityId;
    const pageSize = 500;
    let foundNewOrders = false;

    // Start from page 1 and process orders until we find orders with entity_id <= lastEntityId
    // Magento orders are typically ordered by entity_id descending (newest first)
    while (hasMore) {
      try {
        const response = await makeMagentoRequest('/orders', {
          'searchCriteria[pageSize]': pageSize,
          'searchCriteria[currentPage]': page,
          'searchCriteria[sortOrders][0][field]': 'entity_id',
          'searchCriteria[sortOrders][0][direction]': 'DESC' // Newest first
        });

        const orders = response?.items || [];
        
        if (orders.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`[Incremental Sync] Page ${page}: Found ${orders.length} orders`);

        let pageCreated = 0;
        let pageSkipped = 0;
        let pageErrors = 0;
        let foundOldOrder = false;

        // Process orders
        for (const order of orders) {
          const entityId = order.entity_id || order.id;
          
          if (!entityId) {
            continue;
          }

          // Track highest entity_id
          if (entityId > highestEntityId) {
            highestEntityId = entityId;
          }

          // If we encounter an order with entity_id <= lastEntityId, we've reached old orders
          // Since orders are sorted DESC, all following orders will also be old
          if (entityId <= lastEntityId) {
            console.log(`[Incremental Sync] Reached order with entity_id ${entityId} (<= ${lastEntityId}). Stopping.`);
            foundOldOrder = true;
            hasMore = false;
            break;
          }

          // This is a new order - process it
          foundNewOrders = true;
          
          try {
            const consumerData = convertOrderToConsumer(order, storeMapping);
            
            if (!consumerData || !consumerData.email) {
              pageSkipped++;
              continue;
            }

            // Try to create consumer
            try {
              const newConsumer = await prisma.consumer.create({
                data: consumerData
              });
              pageCreated++;
              
              // Execute workflows for newly created consumer
              executeWorkflowsForConsumer(newConsumer.id).catch(err => {
                console.error('[Incremental Sync] Error executing workflows:', err);
              });
              
            } catch (error) {
              // Check if it's a unique constraint error (consumer already exists)
              if (error.code === 'P2002' || error.message.includes('Unique constraint') || error.message.includes('duplicate key')) {
                pageSkipped++;
              } else {
                throw error;
              }
            }
          } catch (error) {
            console.error(`[Incremental Sync] Error processing order ${entityId}:`, error.message);
            pageErrors++;
          }
        }

        totalCreated += pageCreated;
        totalSkipped += pageSkipped;
        totalErrors += pageErrors;

        console.log(`[Incremental Sync] Page ${page} completed: ${pageCreated} created, ${pageSkipped} skipped, ${pageErrors} errors`);

        // If we found old orders, stop
        if (foundOldOrder) {
          break;
        }

        // If no new orders were found on this page, we might have reached the end
        // But continue to next page to be sure (in case of gaps in entity_ids)
        if (pageCreated === 0 && pageSkipped === 0 && pageErrors === 0) {
          // No orders processed on this page - might be end of new orders
          // Continue one more page to be sure
          if (page > 1) {
            console.log(`[Incremental Sync] No orders processed on page ${page}. Checking one more page...`);
            page++;
            continue;
          }
        }

        // If we processed fewer orders than pageSize, we've reached the end
        if (orders.length < pageSize) {
          hasMore = false;
          break;
        }

        page++;

        // Small delay between pages
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (pageError) {
        console.error(`[Incremental Sync] Error processing page ${page}:`, pageError.message);
        
        // Retry for network errors
        if (pageError.message.includes('timeout') || pageError.message.includes('ECONNRESET')) {
          console.log('[Incremental Sync] Network error. Retrying in 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        } else {
          totalErrors++;
          page++;
        }
      }
    }

    // Update SyncStatus
    const newTotalProcessed = syncStatus.totalProcessed + (totalCreated + totalSkipped + totalErrors);
    const newTotalCreated = syncStatus.totalCreated + totalCreated;
    const newTotalErrors = syncStatus.totalErrors + totalErrors;

    await prisma.syncStatus.update({
      where: { id: syncStatus.id },
      data: {
        lastEntityId: highestEntityId,
        lastSyncAt: new Date(),
        status: 'stopped',
        totalProcessed: newTotalProcessed,
        totalCreated: newTotalCreated,
        totalErrors: newTotalErrors
      }
    });

    console.log(`[Incremental Sync] ✅ Completed!`);
    console.log(`   Created: ${totalCreated}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   New highest entity_id: ${highestEntityId}`);
    
    if (!foundNewOrders) {
      console.log(`[Incremental Sync] ℹ️  No new orders found since last sync (entity_id > ${lastEntityId})`);
    }

    return {
      success: true,
      created: totalCreated,
      skipped: totalSkipped,
      errors: totalErrors,
      highestEntityId: highestEntityId,
      foundNewOrders: foundNewOrders
    };

  } catch (error) {
    console.error('[Incremental Sync] Fatal error:', error);
    
    // Update status to error
    try {
      const syncStatus = await prisma.syncStatus.findUnique({
        where: { syncType: 'incremental' }
      });
      
      if (syncStatus) {
        await prisma.syncStatus.update({
          where: { id: syncStatus.id },
          data: {
            status: 'error',
            errorMessage: error.message
          }
        });
      }
    } catch (updateError) {
      console.error('[Incremental Sync] Error updating status:', updateError);
    }
    
    throw error;
  }
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get incremental sync status
    if (req.method === 'GET') {
      const syncStatus = await prisma.syncStatus.findUnique({
        where: { syncType: 'incremental' }
      });

      return res.json({
        success: true,
        data: syncStatus || {
          syncType: 'incremental',
          lastEntityId: null,
          lastSyncAt: null,
          status: 'stopped',
          totalProcessed: 0,
          totalCreated: 0,
          totalErrors: 0
        }
      });
    }

    // POST - Run incremental sync (called by cronjob)
    if (req.method === 'POST') {
      // Run sync in background
      incrementalSync()
        .then(result => {
          console.log('[Incremental Sync] Background sync completed:', result);
        })
        .catch(error => {
          console.error('[Incremental Sync] Background sync error:', error);
        });

      return res.json({
        success: true,
        message: 'Incremental sync started',
        data: {
          status: 'started'
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('[Incremental Sync API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

