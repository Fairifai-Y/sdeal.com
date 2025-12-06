require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function createNlMailingList2() {
  const existingListName = "NL";
  const newListName = "NL 2"; // Nieuwe lijst naam
  const targetCount = 1000;
  const BATCH_SIZE = 50;

  try {
    console.log(`🔍 Looking for existing mailing list "${existingListName}"...`);
    const existingList = await prisma.emailList.findFirst({
      where: { name: existingListName }
    });

    if (!existingList) {
      console.error(`❌ Existing mailing list "${existingListName}" not found.`);
      process.exit(1);
    }
    console.log(`✅ Found existing list: "${existingList.name}" (${existingList.id})`);

    // Check if new list already exists
    console.log(`\n🔍 Checking if "${newListName}" already exists...`);
    let newList = await prisma.emailList.findFirst({
      where: { name: newListName }
    });

    if (newList) {
      console.log(`⚠️  List "${newListName}" already exists (${newList.id})`);
      console.log(`   Will add consumers to existing list...`);
    } else {
      console.log(`📝 Creating new mailing list "${newListName}"...`);
      newList = await prisma.emailList.create({
        data: {
          name: newListName,
          description: `Nederlandse consumenten lijst (${newListName})`,
          isPublic: false,
          doubleOptIn: false,
          totalConsumers: 0
        }
      });
      console.log(`✅ Created new mailing list: "${newList.name}" (${newList.id})`);
    }

    // Get existing members from the original NL list
    const existingMembers = await prisma.emailListMember.findMany({
      where: { listId: existingList.id },
      select: { consumerId: true }
    });
    const existingConsumerIds = new Set(existingMembers.map(m => m.consumerId));
    console.log(`📊 Existing "${existingListName}" list has ${existingConsumerIds.size} members`);

    // Get current members from the new list
    const newListMembers = await prisma.emailListMember.findMany({
      where: { listId: newList.id },
      select: { consumerId: true }
    });
    const newListConsumerIds = new Set(newListMembers.map(m => m.consumerId));
    console.log(`📊 Current "${newListName}" list has ${newListConsumerIds.size} members`);

    // Calculate how many we need to add
    const neededCount = targetCount - newListConsumerIds.size;

    if (neededCount <= 0) {
      console.log(`✅ List "${newListName}" already has ${newListConsumerIds.size} members (target: ${targetCount})`);
      process.exit(0);
    }

    console.log(`\n🔍 Finding ${neededCount} consumers with country='NL' that are NOT in "${existingListName}" list...`);

    // Find consumers that:
    // 1. Have country='NL'
    // 2. Are not unsubscribed
    // 3. Have a valid email
    // 4. Are NOT in the existing NL list
    // 5. Are NOT already in the new list
    const allExcludedIds = new Set([...existingConsumerIds, ...newListConsumerIds]);

    const consumers = await prisma.consumer.findMany({
      where: {
        country: 'NL',
        isUnsubscribed: false,
        email: {
          contains: '@' // This automatically excludes null values
        },
        id: {
          notIn: Array.from(allExcludedIds)
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

    const validConsumers = consumers
      .filter(c => c.email && c.email.includes('@'))
      .slice(0, neededCount); // Take only the number we need

    console.log(`✅ Found ${validConsumers.length} valid consumers to add (${consumers.length} total, ${consumers.length - validConsumers.length} without valid email)`);

    if (validConsumers.length === 0) {
      console.log('⚠️  No valid consumers found matching the criteria');
      process.exit(0);
    }

    console.log(`\n📝 Adding ${validConsumers.length} consumers to mailing list "${newListName}"...`);
    let added = 0;
    let skipped = 0;

    for (let i = 0; i < validConsumers.length; i += BATCH_SIZE) {
      const batch = validConsumers.slice(i, i + BATCH_SIZE);
      const data = batch.map(consumer => ({
        listId: newList.id,
        consumerId: consumer.id,
        status: 'subscribed',
        source: 'script'
      }));

      try {
        await prisma.emailListMember.createMany({
          data: data,
          skipDuplicates: true // Skip if already exists
        });
        added += batch.length;
        if (added % 100 === 0 || added === validConsumers.length) {
          console.log(`  ✅ Added ${added}/${validConsumers.length}...`);
        }
      } catch (error) {
        console.error(`  ❌ Error adding batch starting with ${batch[0]?.email}:`, error.message);
        skipped += batch.length;
      }
    }

    // Update list totalConsumers count
    const subscribedCount = await prisma.emailListMember.count({
      where: {
        listId: newList.id,
        status: 'subscribed'
      }
    });

    await prisma.emailList.update({
      where: { id: newList.id },
      data: { totalConsumers: subscribedCount }
    });

    console.log(`\n✅ Finished!`);
    console.log(`   List: "${newListName}" (${newList.id})`);
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total members in list: ${subscribedCount}`);
    console.log(`   Target was: ${targetCount}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - "${existingListName}" list: ${existingConsumerIds.size} members`);
    console.log(`   - "${newListName}" list: ${subscribedCount} members`);
    console.log(`   - Total unique consumers across both lists: ${existingConsumerIds.size + subscribedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createNlMailingList2();

