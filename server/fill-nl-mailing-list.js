require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function fillNlMailingList() {
  try {
    console.log('🔍 Looking for mailing list "NL"...');
    
    // Find the "NL" mailing list
    const list = await prisma.emailList.findFirst({
      where: {
        name: {
          contains: 'NL',
          mode: 'insensitive'
        }
      }
    });

    if (!list) {
      console.error('❌ Mailing list "NL" not found');
      console.log('Available lists:');
      const allLists = await prisma.emailList.findMany({
        select: { id: true, name: true }
      });
      allLists.forEach(l => console.log(`  - ${l.name} (${l.id})`));
      process.exit(1);
    }

    console.log(`✅ Found mailing list: "${list.name}" (${list.id})`);
    console.log(`📊 Current members: ${list.totalConsumers || 0}`);

    // Get current members to avoid duplicates
    const existingMembers = await prisma.emailListMember.findMany({
      where: {
        listId: list.id
      },
      select: {
        consumerId: true
      }
    });

    const existingConsumerIds = new Set(existingMembers.map(m => m.consumerId));
    console.log(`📋 Already has ${existingConsumerIds.size} members`);

    // Find consumers with country='NL' or store='NL', not unsubscribed, and not already in the list
    const targetCount = 500;
    const neededCount = targetCount - existingConsumerIds.size;

    if (neededCount <= 0) {
      console.log(`✅ List already has ${existingConsumerIds.size} members (target: ${targetCount})`);
      process.exit(0);
    }

    console.log(`\n🔍 Finding ${neededCount} consumers with country='NL'...`);

    // Find consumers matching criteria (only country='NL')
    // Note: We fetch more than needed to account for invalid emails
    const consumers = await prisma.consumer.findMany({
      where: {
        country: 'NL',
        isUnsubscribed: false,
        id: {
          notIn: Array.from(existingConsumerIds)
        }
      },
      take: neededCount * 2, // Fetch extra to account for invalid emails
      select: {
        id: true,
        email: true,
        country: true,
        store: true
      }
    });

    // Filter out consumers without valid email addresses
    const validConsumers = consumers
      .filter(c => c.email && c.email.includes('@'))
      .slice(0, neededCount); // Take only the number we need

    console.log(`✅ Found ${validConsumers.length} valid consumers to add (${consumers.length} total, ${consumers.length - validConsumers.length} without valid email)`);

    if (validConsumers.length === 0) {
      console.log('⚠️  No valid consumers found matching the criteria');
      process.exit(0);
    }

    // Add consumers to the list
    console.log(`\n📝 Adding ${validConsumers.length} consumers to mailing list...`);
    let added = 0;
    let skipped = 0;

    for (const consumer of validConsumers) {
      try {
        await prisma.emailListMember.upsert({
          where: {
            listId_consumerId: {
              listId: list.id,
              consumerId: consumer.id
            }
          },
          update: {
            status: 'subscribed',
            source: 'script',
            subscribedAt: new Date()
          },
          create: {
            listId: list.id,
            consumerId: consumer.id,
            status: 'subscribed',
            source: 'script'
          }
        });
        added++;
        if (added % 50 === 0) {
          console.log(`  ✅ Added ${added}/${consumers.length}...`);
        }
      } catch (error) {
        console.error(`  ❌ Error adding ${consumer.email}:`, error.message);
        skipped++;
      }
    }

    // Update list totalConsumers count
    const subscribedCount = await prisma.emailListMember.count({
      where: {
        listId: list.id,
        status: 'subscribed'
      }
    });

    await prisma.emailList.update({
      where: { id: list.id },
      data: { totalConsumers: subscribedCount }
    });

    console.log(`\n✅ Finished!`);
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total members in list: ${subscribedCount}`);
    console.log(`   Target was: ${targetCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fillNlMailingList();

