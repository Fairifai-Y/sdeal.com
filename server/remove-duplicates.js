/**
 * Remove duplicate emails, keeping only the consumer with earliest purchaseDate
 * Run: node remove-duplicates.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma');

async function removeDuplicates() {
  console.log('🧹 Removing duplicate emails...\n');
  
  try {
    // Get all consumers
    const allConsumers = await prisma.consumer.findMany({
      select: {
        id: true,
        email: true,
        purchaseDate: true,
        createdAt: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    console.log(`Total consumers: ${allConsumers.length}`);
    
    // Group by email
    const emailGroups = {};
    allConsumers.forEach(consumer => {
      if (!emailGroups[consumer.email]) {
        emailGroups[consumer.email] = [];
      }
      emailGroups[consumer.email].push(consumer);
    });
    
    // Find duplicates
    const duplicates = Object.entries(emailGroups)
      .filter(([email, consumers]) => consumers.length > 1)
      .map(([email, consumers]) => ({ email, consumers }));
    
    if (duplicates.length === 0) {
      console.log('\n✅ No duplicates found!');
      return { removed: 0, kept: allConsumers.length };
    }
    
    console.log(`\nFound ${duplicates.length} duplicate email addresses\n`);
    
    let totalRemoved = 0;
    let totalKept = 0;
    
    // Process each duplicate group
    for (const { email, consumers } of duplicates) {
      // Sort by purchaseDate (earliest first), then by createdAt
      consumers.sort((a, b) => {
        const dateA = a.purchaseDate || a.createdAt;
        const dateB = b.purchaseDate || b.createdAt;
        return dateA.getTime() - dateB.getTime();
      });
      
      // Keep the first one (earliest purchaseDate)
      const keep = consumers[0];
      const remove = consumers.slice(1);
      
      console.log(`📧 ${email}:`);
      console.log(`   ✅ Keeping: ID ${keep.id} (Purchase: ${keep.purchaseDate?.toISOString() || 'N/A'})`);
      
      // Delete the rest
      for (const consumer of remove) {
        await prisma.consumer.delete({
          where: { id: consumer.id }
        });
        console.log(`   ❌ Removed: ID ${consumer.id} (Purchase: ${consumer.purchaseDate?.toISOString() || 'N/A'})`);
        totalRemoved++;
      }
      
      totalKept++;
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('📊 Cleanup Summary:');
    console.log(`   ✅ Kept: ${totalKept} consumers (one per email)`);
    console.log(`   ❌ Removed: ${totalRemoved} duplicates`);
    console.log('='.repeat(80));
    
    return {
      removed: totalRemoved,
      kept: totalKept
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicates()
  .then((result) => {
    console.log('\n✅ Cleanup completed successfully!');
    console.log(`   You can now run the migration to add unique constraint on email.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });

