require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function fillDeMailingList() {
  try {
    const listName = "DE";
    const targetCount = 1000;
    const BATCH_SIZE = 50; // Smaller batch size for adding to list

    console.log(`🔍 Looking for mailing list "${listName}"...`);
    const deList = await prisma.emailList.findFirst({
      where: { name: listName }
    });

    if (!deList) {
      console.error(`❌ Mailing list "${listName}" not found.`);
      console.log('Available lists:');
      const allLists = await prisma.emailList.findMany({
        select: { id: true, name: true }
      });
      allLists.forEach(l => console.log(`  - ${l.name} (${l.id})`));
      process.exit(1);
    }
    console.log(`✅ Found mailing list: "${deList.name}" (${deList.id})`);

    const existingMembers = await prisma.emailListMember.findMany({
      where: { listId: deList.id },
      select: { consumerId: true }
    });
    const existingConsumerIds = new Set(existingMembers.map(m => m.consumerId));
    console.log(`📊 Current members: ${existingConsumerIds.size}`);

    const neededCount = targetCount - existingConsumerIds.size;

    if (neededCount <= 0) {
      console.log(`✅ List already has ${existingConsumerIds.size} members (target: ${targetCount})`);
      process.exit(0);
    }

    console.log(`\n🔍 Finding ${neededCount} consumers with country='DE'...`);

    const consumers = await prisma.consumer.findMany({
      where: {
        country: 'DE', // Filter for country 'DE'
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
      console.log('No new consumers found to add.');
      process.exit(0);
    }

    console.log(`\n📝 Adding ${validConsumers.length} consumers to mailing list...`);
    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < validConsumers.length; i += BATCH_SIZE) {
      const batch = validConsumers.slice(i, i + BATCH_SIZE);
      const data = batch.map(consumer => ({
        listId: deList.id,
        consumerId: consumer.id,
        status: 'subscribed',
        source: 'manual-script'
      }));

      try {
        await prisma.emailListMember.createMany({
          data: data,
          skipDuplicates: true // Skip if already exists
        });
        addedCount += batch.length;
        console.log(`  ✅ Added ${addedCount}/${validConsumers.length}...`);
      } catch (error) {
        console.error(`  ❌ Error adding batch starting with ${batch[0]?.email}:`, error.message);
        skippedCount += batch.length;
      }
    }

    // Update list totalConsumers count
    const newSubscribedCount = await prisma.emailListMember.count({
      where: {
        listId: deList.id,
        status: 'subscribed'
      }
    });

    await prisma.emailList.update({
      where: { id: deList.id },
      data: { totalConsumers: newSubscribedCount }
    });

    console.log(`\n✅ Finished!`);
    console.log(`   Added: ${addedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total members in list: ${newSubscribedCount}`);
    console.log(`   Target was: ${targetCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fillDeMailingList();

