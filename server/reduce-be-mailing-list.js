require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function reduceBeMailingList() {
  try {
    console.log('🔍 Looking for mailing list "BE"...');
    
    // Find the "BE" mailing list
    const list = await prisma.emailList.findFirst({
      where: {
        name: {
          contains: 'BE',
          mode: 'insensitive'
        }
      },
      include: {
        _count: {
          select: {
            listMembers: {
              where: {
                status: 'subscribed'
              }
            }
          }
        }
      }
    });

    if (!list) {
      console.error('❌ Mailing list "BE" not found');
      console.log('Available lists:');
      const allLists = await prisma.emailList.findMany({
        select: { id: true, name: true }
      });
      allLists.forEach(l => console.log(`  - ${l.name} (${l.id})`));
      process.exit(1);
    }

    console.log(`✅ Found mailing list: "${list.name}" (${list.id})`);
    console.log(`📊 Current subscribed members: ${list._count.listMembers}`);

    const currentCount = list._count.listMembers;
    const targetCount = 1000;

    if (currentCount <= targetCount) {
      console.log(`✅ List already has ${currentCount} members (target: ${targetCount})`);
      process.exit(0);
    }

    const toRemove = currentCount - targetCount;
    console.log(`\n📉 Need to remove ${toRemove} members to reach target of ${targetCount}`);

    // Get all subscribed members, ordered by subscribedAt (newest first)
    // We'll keep the newest 1000 and remove the oldest ones
    const allMembers = await prisma.emailListMember.findMany({
      where: {
        listId: list.id,
        status: 'subscribed'
      },
      orderBy: {
        subscribedAt: 'desc' // Newest first
      },
      select: {
        id: true,
        consumerId: true,
        subscribedAt: true
      }
    });

    console.log(`📋 Found ${allMembers.length} subscribed members`);

    // Keep the first 1000 (newest), remove the rest
    const membersToKeep = allMembers.slice(0, targetCount);
    const membersToRemove = allMembers.slice(targetCount);

    console.log(`\n✅ Will keep: ${membersToKeep.length} members (newest)`);
    console.log(`❌ Will remove: ${membersToRemove.length} members (oldest)`);

    if (membersToRemove.length === 0) {
      console.log('⚠️  No members to remove');
      process.exit(0);
    }

    // Confirm removal
    console.log(`\n🗑️  Removing ${membersToRemove.length} members...`);
    let removed = 0;
    let errors = 0;

    // Remove in batches to avoid overwhelming the database
    const BATCH_SIZE = 100;
    for (let i = 0; i < membersToRemove.length; i += BATCH_SIZE) {
      const batch = membersToRemove.slice(i, i + BATCH_SIZE);
      const memberIds = batch.map(m => m.id);

      try {
        const result = await prisma.emailListMember.deleteMany({
          where: {
            id: { in: memberIds }
          }
        });
        removed += result.count;
        if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= membersToRemove.length) {
          console.log(`  ✅ Removed ${removed}/${membersToRemove.length}...`);
        }
      } catch (error) {
        console.error(`  ❌ Error removing batch:`, error.message);
        errors++;
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
    console.log(`   Removed: ${removed}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Remaining subscribed members: ${subscribedCount}`);
    console.log(`   Target was: ${targetCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

reduceBeMailingList();

