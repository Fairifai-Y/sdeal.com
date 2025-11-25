/**
 * Find the last entity_id by looking up the last consumers in the database
 * and finding their corresponding Magento orders
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { makeRequest: makeMagentoRequest } = require('../api/magento/helpers');
const prisma = require('../api/lib/prisma');
const fs = require('fs');
const path = require('path');

const CHECKPOINT_FILE = path.join(__dirname, 'sync-checkpoint.json');

async function findLastEntityId() {
  try {
    console.log('🔍 Finding last entity_id from last consumers in database...\n');
    
    // Get last 50 consumers from database
    const lastConsumers = await prisma.consumer.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${lastConsumers.length} recent consumers`);
    console.log(`   Last consumer: ${lastConsumers[0]?.email} (created: ${lastConsumers[0]?.createdAt})\n`);
    
    // Extract emails
    const emails = lastConsumers.map(c => c.email);
    console.log(`🔍 Searching Magento orders for these emails...\n`);
    
    // Search for orders - start from newest orders (page 1) and work backwards
    // The newest orders are on page 1, so we should find the last consumer quickly
    let highestEntityId = 0;
    const emailToEntityId = new Map();
    const maxPages = 5; // Only search first 5 pages (newest orders) - should contain the last consumer
    
    console.log('   Searching from newest orders (page 1) backwards...\n');
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const ordersData = await makeMagentoRequest('/orders', {
          'searchCriteria[pageSize]': 100,
          'searchCriteria[currentPage]': page
        });
        
        const orders = ordersData?.items || [];
        
        if (orders.length === 0) {
          break;
        }
        
        // Check each order
        for (const order of orders) {
          const entityId = order.entity_id || order.id;
          if (!entityId) continue;
          
          const email = order.customer_email || 
                       order.customerEmail || 
                       order.email ||
                       (order.billing_address?.email) ||
                       (order.shipping_address?.email);
          
          if (email && emails.includes(email)) {
            if (!emailToEntityId.has(email) || entityId > emailToEntityId.get(email)) {
              emailToEntityId.set(email, entityId);
              if (entityId > highestEntityId) {
                highestEntityId = entityId;
              }
            }
          }
          
          // Track highest entity_id overall
          if (entityId > highestEntityId) {
            highestEntityId = entityId;
          }
        }
        
        // If we found the last consumer email, we can stop early
        if (emailToEntityId.has(lastConsumers[0].email)) {
          console.log(`✅ Found order for last consumer (${lastConsumers[0].email}), entity_id: ${emailToEntityId.get(lastConsumers[0].email)}\n`);
          // Continue a bit more to find the highest entity_id
          if (page < 5) {
            continue;
          } else {
            break;
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (page % 5 === 0) {
          console.log(`   Searched ${page} pages, found ${emailToEntityId.size}/${emails.length} emails, highest entity_id: ${highestEntityId}...`);
        }
        
      } catch (error) {
        console.error(`❌ Error searching page ${page}:`, error.message);
        break;
      }
    }
    
    console.log('\n📊 Results:');
    console.log(`   Highest entity_id found: ${highestEntityId}`);
    console.log(`   Emails matched: ${emailToEntityId.size}/${emails.length}`);
    
    if (emailToEntityId.size > 0) {
      console.log('\n📋 Email to Entity ID mapping:');
      const sorted = Array.from(emailToEntityId.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      sorted.forEach(([email, entityId]) => {
        console.log(`   ${email}: entity_id ${entityId}`);
      });
    }
    
    // Update checkpoint if we found a higher entity_id
    if (highestEntityId > 0) {
      let checkpoint = null;
      if (fs.existsSync(CHECKPOINT_FILE)) {
        checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      }
      
      const currentLastEntityId = checkpoint?.lastEntityId || 0;
      
      if (highestEntityId > currentLastEntityId) {
        console.log(`\n✅ Updating checkpoint: ${currentLastEntityId} → ${highestEntityId}`);
        
        const newCheckpoint = {
          lastPage: checkpoint?.lastPage || 1,
          lastEntityId: highestEntityId,
          totalCreated: checkpoint?.totalCreated || 0,
          totalSkipped: checkpoint?.totalSkipped || 0,
          totalErrors: checkpoint?.totalErrors || 0,
          lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(newCheckpoint, null, 2));
        console.log('✅ Checkpoint updated!\n');
      } else {
        console.log(`\n⚠️  Found entity_id ${highestEntityId} is not higher than current ${currentLastEntityId}`);
      }
    } else {
      console.log('\n⚠️  Could not find any entity_ids');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

findLastEntityId();

