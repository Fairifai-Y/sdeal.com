/**
 * Get the last entity_id from checkpoint or database
 * Run: node get-last-entity-id.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma');
const fs = require('fs');
const path = require('path');

const CHECKPOINT_FILE = path.join(__dirname, 'sync-checkpoint.json');

async function getLastEntityId() {
  try {
    // First check checkpoint
    let checkpoint = null;
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
      checkpoint = JSON.parse(data);
      console.log('📌 Checkpoint found:');
      console.log(`   Last entity_id: ${checkpoint.lastEntityId}`);
      console.log(`   Last page: ${checkpoint.lastPage}`);
    }
    
    // Get highest entity_id from consumers
    const maxConsumer = await prisma.consumer.findFirst({
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        email: true,
        store: true,
        country: true,
        createdAt: true
      }
    });
    
    console.log('\n📊 Database info:');
    if (maxConsumer) {
      console.log(`   Highest consumer ID: ${maxConsumer.id}`);
      console.log(`   Last consumer: ${maxConsumer.email} (store=${maxConsumer.store}, country=${maxConsumer.country})`);
      console.log(`   Created at: ${maxConsumer.createdAt}`);
    } else {
      console.log('   No consumers found in database');
    }
    
    // Get store distribution
    const storeCounts = await prisma.consumer.groupBy({
      by: ['store'],
      _count: {
        id: true
      }
    });
    
    console.log('\n📊 Store distribution:');
    storeCounts.forEach(item => {
      console.log(`   ${item.store || 'NULL'}: ${item._count.id} consumers`);
    });
    
    // Get country distribution
    const countryCounts = await prisma.consumer.groupBy({
      by: ['country'],
      _count: {
        id: true
      }
    });
    
    console.log('\n📊 Country distribution:');
    countryCounts.forEach(item => {
      console.log(`   ${item.country || 'NULL'}: ${item._count.id} consumers`);
    });
    
    // Get sample of recent consumers
    const recentConsumers = await prisma.consumer.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        email: true,
        store: true,
        country: true
      }
    });
    
    console.log('\n📋 Recent consumers (last 10):');
    recentConsumers.forEach((consumer, idx) => {
      console.log(`   ${idx + 1}. ${consumer.email}: store=${consumer.store || 'NULL'}, country=${consumer.country || 'NULL'}`);
    });
    
    const lastEntityId = checkpoint ? checkpoint.lastEntityId : 0;
    console.log(`\n💡 Recommended start entity_id: ${lastEntityId}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

getLastEntityId();

