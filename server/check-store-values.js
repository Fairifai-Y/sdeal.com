/**
 * Check store values in database
 * Run: node check-store-values.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma');

async function checkStoreValues() {
  try {
    console.log('🔍 Checking store values in database...\n');
    
    // Get store distribution
    const storeCounts = await prisma.consumer.groupBy({
      by: ['store'],
      _count: {
        id: true
      }
    });
    
    console.log('📊 Store distribution:');
    storeCounts.forEach(item => {
      console.log(`  ${item.store || 'NULL'}: ${item._count.id} consumers`);
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
      console.log(`  ${item.country || 'NULL'}: ${item._count.id} consumers`);
    });
    
    // Get sample consumers with different stores
    const samples = await prisma.consumer.findMany({
      select: {
        email: true,
        store: true,
        country: true,
        source: true
      },
      take: 20,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n📋 Sample consumers (last 20):');
    samples.forEach((consumer, idx) => {
      console.log(`  ${idx + 1}. ${consumer.email}: store=${consumer.store || 'NULL'}, country=${consumer.country || 'NULL'}, source=${consumer.source || 'NULL'}`);
    });
    
    // Check if all stores are NL
    const uniqueStores = storeCounts.map(item => item.store).filter(Boolean);
    if (uniqueStores.length === 1 && uniqueStores[0] === 'NL') {
      console.log('\n⚠️  WARNING: All consumers have store=NL! This might indicate a mapping issue.');
    } else {
      console.log(`\n✅ Good: Found ${uniqueStores.length} different stores: ${uniqueStores.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

checkStoreValues();

