/**
 * Check for duplicate emails in Consumer table
 * Run: node check-duplicates.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma');

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate emails...\n');
  
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
      console.log('\n✅ No duplicate emails found!');
      console.log('You can safely run the migration to add unique constraint on email.');
    } else {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate email addresses:\n`);
      
      duplicates.forEach(({ email, consumers }) => {
        console.log(`📧 ${email} (${consumers.length} records):`);
        consumers.forEach((c, i) => {
          console.log(`   ${i + 1}. ID: ${c.id}, Purchase Date: ${c.purchaseDate?.toISOString() || 'N/A'}, Created: ${c.createdAt.toISOString()}`);
        });
        console.log('');
      });
      
      console.log('\n💡 Recommendation:');
      console.log('   Keep the consumer with the earliest purchaseDate (or createdAt if purchaseDate is null)');
      console.log('   Delete the other duplicates before running the migration.');
    }
    
    return {
      total: allConsumers.length,
      unique: Object.keys(emailGroups).length,
      duplicates: duplicates.length
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates()
  .then((result) => {
    console.log('\n📊 Summary:');
    console.log(`   Total consumers: ${result.total}`);
    console.log(`   Unique emails: ${result.unique}`);
    console.log(`   Duplicate emails: ${result.duplicates}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

