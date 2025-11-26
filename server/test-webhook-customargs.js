require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function testWebhookCustomArgs() {
  try {
    // Get a recent batch
    const batch = await prisma.emailBatch.findFirst({
      orderBy: { createdAt: 'desc' },
      where: {
        status: 'sent'
      }
    });

    if (!batch) {
      console.log('❌ No sent batches found');
      process.exit(0);
    }

    console.log(`📦 Batch: ${batch.id}`);
    console.log(`   Campaign: ${batch.campaignId}`);
    console.log(`   Status: ${batch.status}`);
    
    const emails = Array.isArray(batch.emails) ? batch.emails : [];
    console.log(`   Emails in batch: ${emails.length}\n`);

    if (emails.length > 0) {
      console.log('📧 First email in batch:');
      const firstEmail = emails[0];
      console.log(`   To: ${firstEmail.to}`);
      console.log(`   From: ${firstEmail.from}`);
      console.log(`   Subject: ${firstEmail.subject}`);
      console.log(`   CustomArgs:`, JSON.stringify(firstEmail.customArgs, null, 2));
      
      if (!firstEmail.customArgs) {
        console.log(`\n⚠️  PROBLEM: First email has no customArgs!`);
      } else if (!firstEmail.customArgs.source) {
        console.log(`\n⚠️  PROBLEM: First email customArgs has no source!`);
      } else if (firstEmail.customArgs.source !== 'sdeal-mailing') {
        console.log(`\n⚠️  PROBLEM: First email source is "${firstEmail.customArgs.source}", expected "sdeal-mailing"!`);
      } else {
        console.log(`\n✅ First email has correct customArgs with source: ${firstEmail.customArgs.source}`);
      }
    }

    // Check recent webhook events to see what source they have
    console.log('\n📊 Recent Email Events (to see if webhook is processing):');
    const recentEvents = await prisma.emailEvent.findMany({
      where: {
        campaignId: batch.campaignId,
        eventType: { in: ['opened', 'clicked', 'delivered'] }
      },
      take: 5,
      orderBy: { occurredAt: 'desc' }
    });

    if (recentEvents.length > 0) {
      console.log(`   Found ${recentEvents.length} recent events`);
      recentEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.eventType} at ${event.occurredAt}`);
      });
    } else {
      console.log(`   ⚠️  No recent webhook events found - webhook might not be processing events`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testWebhookCustomArgs();

