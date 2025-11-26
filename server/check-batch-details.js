require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkBatchDetails() {
  try {
    // Get the most recent campaign
    const recentCampaign = await prisma.emailCampaign.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        emailBatches: true
      }
    });

    if (!recentCampaign) {
      console.log('❌ No campaigns found');
      process.exit(0);
    }

    console.log(`📧 Campaign: "${recentCampaign.name}"`);
    console.log(`   Total Recipients: ${recentCampaign.totalRecipients || 0}`);
    console.log(`   Total Sent: ${recentCampaign.totalSent || 0}`);
    console.log(`   Batches: ${recentCampaign.emailBatches.length}\n`);

    for (const batch of recentCampaign.emailBatches) {
      const emails = Array.isArray(batch.emails) ? batch.emails : [];
      console.log(`📦 Batch: ${batch.id}`);
      console.log(`   Status: ${batch.status}`);
      console.log(`   Emails in batch: ${emails.length}`);
      console.log(`   Sent Count: ${batch.sentCount || 0}`);
      console.log(`   Failed Count: ${batch.failedCount || 0}`);
      
      if (emails.length > 0) {
        console.log(`   First email: ${emails[0].to || 'N/A'}`);
        console.log(`   Last email: ${emails[emails.length - 1].to || 'N/A'}`);
      }
      console.log('');
    }

    // Check if there should be more batches
    const expectedBatches = Math.ceil((recentCampaign.totalRecipients || 0) / 100);
    console.log(`\n📊 Analysis:`);
    console.log(`   Expected batches (500 recipients / 100 per batch): ${expectedBatches}`);
    console.log(`   Actual batches: ${recentCampaign.emailBatches.length}`);
    
    if (recentCampaign.emailBatches.length < expectedBatches) {
      console.log(`   ⚠️  Missing batches! Should have ${expectedBatches} batches but only ${recentCampaign.emailBatches.length} were created.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkBatchDetails();

