/**
 * Script to fix store and country for the first 5888 consumers
 * This script re-fetches orders from Magento and recalculates store/country
 * Run: node fix-consumer-store-country.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { makeRequest: makeMagentoRequest } = require('../api/magento/helpers');
const prisma = require('../api/lib/prisma');

// Store mapping
const storeMapping = {
  1: 'NL',
  2: 'DE',
  3: 'BE',
  4: 'FR'
};

/**
 * Determine store and country from order (same logic as new sync script)
 */
function determineStoreAndCountry(order) {
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
  
  // Determine country
  const country = order.billing_address?.country_id || 
                  order.shipping_address?.country_id ||
                  order.shipping_countryid || 
                  order.country_id || 
                  order.shipping_country || 
                  store;
  
  return { store, country };
}

/**
 * Fetch orders from Magento and create email -> order mapping
 */
async function fetchOrdersForEmails(emails, maxPages = 50) {
  const emailSet = new Set(emails);
  const emailToOrderMap = new Map();
  
  console.log(`🔍 Fetching orders for ${emails.length} emails...`);
  
  try {
    // Fetch orders in batches and match by email
    for (let page = 1; page <= maxPages; page++) {
      const response = await makeMagentoRequest('/orders', {
        'searchCriteria[pageSize]': 100,
        'searchCriteria[currentPage]': page
      });
      
      if (!response || !response.items || response.items.length === 0) {
        break; // No more orders
      }
      
      // Match orders to emails
      for (const order of response.items) {
        const email = order.customer_email || 
                     order.customerEmail || 
                     order.email ||
                     (order.billing_address?.email) ||
                     (order.shipping_address?.email);
        
        if (email && emailSet.has(email) && !emailToOrderMap.has(email)) {
          emailToOrderMap.set(email, order);
        }
      }
      
      // If we found all emails, we can stop early
      if (emailToOrderMap.size === emailSet.size) {
        break;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Found orders for ${emailToOrderMap.size} out of ${emails.length} emails`);
    
  } catch (error) {
    console.error(`Error fetching orders:`, error.message);
  }
  
  return emailToOrderMap;
}

async function fixConsumers() {
  const START_RECORD = 5888; // Start from record 5888
  const LIMIT = 500; // Process 500 records going down to record 1
  const BATCH_SIZE = 100;
  
  console.log(`🔧 Starting to fix store and country for ${LIMIT} consumers from record ${START_RECORD} going down to record 1 (ascending order, backwards)...\n`);
  
  let totalFixed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let processed = 0;
  
  // Get total count to calculate how many to skip
  const totalCount = await prisma.consumer.count();
  console.log(`📊 Total consumers in database: ${totalCount}`);
  
  // We want to process records from 5888 down to 1
  // In ascending order, record 1 is at skip 0, record 5888 is at skip 5887
  // So we start at skip 5887 and go down (decrease skip)
  let currentSkip = START_RECORD - 1; // Start at record 5888 (skip 5887)
  
  while (processed < LIMIT && currentSkip >= 0) {
    const take = Math.min(BATCH_SIZE, LIMIT - processed, currentSkip + 1);
    const recordStart = currentSkip + 1;
    const recordEnd = Math.max(1, currentSkip - take + 2);
    
    console.log(`\n📦 Processing batch: records ${recordEnd} to ${recordStart} (skip ${Math.max(0, currentSkip - take + 1)} to ${currentSkip}, batch ${processed + 1} to ${processed + take} of ${LIMIT})...`);
    
    // Get consumers in batch (ascending order, going backwards from record 5888)
    // We fetch from (currentSkip - take + 1) to currentSkip, then reverse to go from high to low
    const skipValue = Math.max(0, currentSkip - take + 1);
    const consumers = await prisma.consumer.findMany({
      skip: skipValue,
      take: take,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        store: true,
        country: true
      }
    });
    
    if (consumers.length === 0) {
      console.log('No more consumers to process');
      break;
    }
    
    // Filter consumers that need fixing (store = NL and country = NL)
    const consumersToFix = consumers.filter(c => c.store === 'NL' && c.country === 'NL');
    const emailsToFix = consumersToFix.map(c => c.email);
    
    if (emailsToFix.length === 0) {
      console.log(`⏭️  All consumers in this batch already have correct store/country`);
      totalSkipped += consumers.length;
    } else {
      // Fetch orders for all emails in batch
      const emailToOrderMap = await fetchOrdersForEmails(emailsToFix);
      
      // Process each consumer
      for (const consumer of consumersToFix) {
      try {
        const order = emailToOrderMap.get(consumer.email);
        
        if (!order) {
          console.log(`⚠️  No order found for ${consumer.email}, skipping...`);
          totalSkipped++;
          continue;
        }
        
        // Determine correct store and country
        const { store, country } = determineStoreAndCountry(order);
        
        // Only update if different
        if (store !== consumer.store || country !== consumer.country) {
          await prisma.consumer.update({
            where: { id: consumer.id },
            data: {
              store: store,
              country: country
            }
          });
          
          console.log(`✅ Updated ${consumer.email}: store ${consumer.store} → ${store}, country ${consumer.country} → ${country}`);
          totalFixed++;
        } else {
          console.log(`✓ ${consumer.email} already correct (store: ${store}, country: ${country})`);
          totalSkipped++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${consumer.email}:`, error.message);
        totalErrors++;
      }
      }
      
      // Count skipped consumers that were already correct
      totalSkipped += (consumers.length - consumersToFix.length);
    }
    
    // Reverse the array to process from highest to lowest record number
    // (since we're going from record 5888 down to record 1)
    consumers.reverse();
    
    processed += consumers.length;
    currentSkip = Math.max(0, currentSkip - take);
    
    // Progress summary
    console.log(`\n📊 Progress: ${processed}/${LIMIT} processed | Fixed: ${totalFixed} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`);
    console.log(`   Next batch will start from record ${currentSkip + 1}`);
  }
  
  console.log(`\n✅ Finished fixing consumers!`);
  console.log(`   Total fixed: ${totalFixed}`);
  console.log(`   Total skipped: ${totalSkipped}`);
  console.log(`   Total errors: ${totalErrors}`);
}

// Run the script
fixConsumers()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

