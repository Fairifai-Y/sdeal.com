/**
 * Test script to fetch orders and save as customers in database
 * Supports checkpoint/resume functionality
 * Run: node test-sync-100.js [pageSize] [startPage]
 * Example: node test-sync-100.js 500 1
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { makeRequest: makeMagentoRequest } = require('../api/magento/helpers');
const prisma = require('../api/lib/prisma');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Checkpoint file location
const CHECKPOINT_FILE = path.join(__dirname, 'sync-checkpoint.json');

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
    return null; // Skip orders without valid email
  }

  // Extract name from order
  let firstName = order.customer_firstname || 
                 order.first_name || 
                 (order.billing_address?.firstname) || '';
  let lastName = order.customer_lastname || 
                order.last_name || 
                (order.billing_address?.lastname) || '';
  
  // If no name, try to extract from customer_name
  if (!firstName && !lastName && order.customer_name && !order.customer_name.includes('@')) {
    const nameParts = order.customer_name.trim().split(/\s+/);
    if (nameParts.length > 0) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || '';
    }
  }
  
  // Fallback: extract from email
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

  // Purchase date from order
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
    console.warn('⚠️  Could not load checkpoint:', error.message);
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
    console.error('❌ Could not save checkpoint:', error.message);
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

async function syncOrders(options = {}) {
  const {
    pageSize = 500,
    startPage = 1,
    maxPages = null,
    resume = true
  } = options;
  
  // Load checkpoint if resuming
  let checkpoint = null;
  if (resume) {
    checkpoint = loadCheckpoint();
    if (checkpoint) {
      console.log('📌 Checkpoint found! Resuming from where we left off...\n');
      console.log(`   Last page: ${checkpoint.lastPage}`);
      console.log(`   Last entity_id: ${checkpoint.lastEntityId}`);
      console.log(`   Total created: ${checkpoint.totalCreated}`);
      console.log(`   Total skipped: ${checkpoint.totalSkipped}`);
      console.log(`   Total errors: ${checkpoint.totalErrors}\n`);
    }
  }
  
  const currentPage = checkpoint ? checkpoint.lastPage + 1 : startPage;
  const totalCreated = checkpoint ? checkpoint.totalCreated : 0;
  const totalSkipped = checkpoint ? checkpoint.totalSkipped : 0;
  const totalErrors = checkpoint ? checkpoint.totalErrors : 0;
  const lastEntityId = checkpoint ? checkpoint.lastEntityId : 0;
  
  console.log(`🚀 Starting sync (page size: ${pageSize}, starting from page: ${currentPage})...\n`);
  
  const startTime = Date.now();
  let page = currentPage;
  let hasMore = true;
  let sessionCreated = 0;
  let sessionSkipped = 0;
  let sessionErrors = 0;
  let highestEntityId = lastEntityId;
  
  try {
    while (hasMore && (!maxPages || page <= startPage + maxPages - 1)) {
      try {
        console.log(`📦 Fetching page ${page} (${pageSize} orders per page)...`);
        const pageStartTime = Date.now();
        
        const ordersData = await makeMagentoRequest('/orders', {
          'searchCriteria[pageSize]': pageSize,
          'searchCriteria[currentPage]': page
        });
        
        const orders = ordersData?.items || [];
        const pageFetchTime = ((Date.now() - pageStartTime) / 1000).toFixed(1);
        
        if (orders.length === 0) {
          console.log(`✅ No more orders found at page ${page}. Sync complete!\n`);
          hasMore = false;
          break;
        }
        
        console.log(`✅ Received ${orders.length} orders (fetched in ${pageFetchTime}s)\n`);
        console.log('💾 Processing orders and saving to database...\n');
        
        // Process each order
        for (let i = 0; i < orders.length; i++) {
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
            
            // Check if consumer already exists (email only - no duplicates)
            const existingConsumer = await prisma.consumer.findFirst({
              where: {
                email: consumerData.email
              }
            });
            
            // If not exists, create
            if (!existingConsumer) {
              await prisma.consumer.create({
                data: consumerData
              });
              sessionCreated++;
              
              if ((sessionCreated + totalCreated) % 50 === 0) {
                console.log(`✅ Created ${sessionCreated + totalCreated} customers so far...`);
              }
            } else {
              sessionSkipped++;
            }
            
          } catch (error) {
            console.error(`❌ Order ${orderId}: Error -`, error.message);
            sessionErrors++;
          }
        }
        
        // Update totals
        const newTotalCreated = totalCreated + sessionCreated;
        const newTotalSkipped = totalSkipped + sessionSkipped;
        const newTotalErrors = totalErrors + sessionErrors;
        
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
        
        const pageTime = ((Date.now() - pageStartTime) / 1000).toFixed(1);
        console.log(`\n📊 Page ${page} completed in ${pageTime}s:`);
        console.log(`   ✅ Created this page: ${sessionCreated}`);
        console.log(`   ⏭️  Skipped this page: ${sessionSkipped}`);
        console.log(`   ❌ Errors this page: ${sessionErrors}`);
        console.log(`   📈 Total so far: ${newTotalCreated} created, ${newTotalSkipped} skipped, ${newTotalErrors} errors\n`);
        
        // Reset session counters
        sessionCreated = 0;
        sessionSkipped = 0;
        sessionErrors = 0;
        
        // Check if we should continue
        if (orders.length < pageSize) {
          console.log(`✅ Reached end of orders (received ${orders.length} < ${pageSize}). Sync complete!\n`);
          hasMore = false;
          break;
        }
        
        page++;
        
        // Small delay between pages to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (pageError) {
        console.error(`❌ Error processing page ${page}:`, pageError.message);
        console.error('💾 Checkpoint saved. You can resume later.\n');
        sessionErrors++;
        // Continue to next page or break on fatal error
        if (pageError.message.includes('timeout') || pageError.message.includes('ECONNRESET')) {
          console.log('⏸️  Network error detected. Pausing for 5 seconds before retry...\n');
          await new Promise(resolve => setTimeout(resolve, 5000));
          // Retry same page
          continue;
        } else {
          page++;
        }
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    // Load final totals from checkpoint (which has the latest totals)
    const finalCheckpoint = loadCheckpoint();
    const finalTotalCreated = finalCheckpoint ? finalCheckpoint.totalCreated : (totalCreated + sessionCreated);
    const finalTotalSkipped = finalCheckpoint ? finalCheckpoint.totalSkipped : (totalSkipped + sessionSkipped);
    const finalTotalErrors = finalCheckpoint ? finalCheckpoint.totalErrors : (totalErrors + sessionErrors);
    
    console.log('='.repeat(80));
    console.log('📊 Final Sync Summary:');
    console.log(`   Pages processed: ${page - startPage}`);
    console.log(`   ✅ Total created: ${finalTotalCreated}`);
    console.log(`   ⏭️  Total skipped: ${finalTotalSkipped}`);
    console.log(`   ❌ Total errors: ${finalTotalErrors}`);
    console.log(`   ⏱️  Total time: ${totalTime} minutes`);
    console.log(`   📍 Last entity_id: ${highestEntityId}`);
    console.log('='.repeat(80));
    
    // Clear checkpoint if sync completed successfully
    if (hasMore === false) {
      clearCheckpoint();
      console.log('\n✅ Sync completed! Checkpoint cleared.');
    } else {
      console.log('\n⏸️  Sync paused. Checkpoint saved. Run again to resume.');
    }
    
    return {
      pagesProcessed: page - startPage,
      totalCreated: finalTotalCreated,
      totalSkipped: finalTotalSkipped,
      totalErrors: finalTotalErrors,
      lastEntityId: highestEntityId,
      lastPage: page - 1
    };
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.error('💾 Checkpoint saved. You can resume later.');
    throw error;
  } finally {
    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const pageSize = parseInt(args[0]) || 500;
const startPage = parseInt(args[1]) || 1;
const maxPages = args[2] ? parseInt(args[2]) : null;
const noResume = args.includes('--no-resume') || args.includes('--fresh');

console.log('📋 Sync Configuration:');
console.log(`   Page size: ${pageSize}`);
console.log(`   Start page: ${startPage}`);
if (maxPages) {
  console.log(`   Max pages: ${maxPages}`);
}
console.log(`   Resume: ${!noResume ? 'Yes (will check for checkpoint)' : 'No (fresh start)'}\n`);

// Run sync
syncOrders({
  pageSize,
  startPage,
  maxPages,
  resume: !noResume
})
  .then((result) => {
    console.log('\n✅ Sync completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  });

