require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkBatches() {
  try {
    // Get all batches for the most recent campaign
    const recentCampaign = await prisma.emailCampaign.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        emailBatches: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!recentCampaign) {
      console.log('No campaigns found');
      return;
    }

    console.log(`\n📊 Campaign: ${recentCampaign.name} (${recentCampaign.id})`);
    console.log(`   Status: ${recentCampaign.status}`);
    console.log(`   Total Recipients: ${recentCampaign.totalRecipients}`);
    console.log(`   Total Sent: ${recentCampaign.totalSent}`);
    console.log(`   Created: ${recentCampaign.createdAt}`);
    
    console.log(`\n📦 Batches (${recentCampaign.emailBatches.length} total):`);
    
    const batchStats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0
    };

    for (const batch of recentCampaign.emailBatches) {
      const emailCount = Array.isArray(batch.emails) ? batch.emails.length : 0;
      batchStats[batch.status] = (batchStats[batch.status] || 0) + 1;
      
      console.log(`   Batch ${batch.id.substring(0, 8)}... - Status: ${batch.status} - Emails: ${emailCount} - Created: ${batch.createdAt}`);
      if (batch.errorMessage) {
        console.log(`      Error: ${batch.errorMessage}`);
      }
    }

    console.log(`\n📈 Batch Status Summary:`);
    console.log(`   Pending: ${batchStats.pending}`);
    console.log(`   Processing: ${batchStats.processing}`);
    console.log(`   Sent: ${batchStats.sent}`);
    console.log(`   Failed: ${batchStats.failed}`);

    // Calculate expected batches
    const expectedBatches = Math.ceil(recentCampaign.totalRecipients / 100);
    console.log(`\n🔍 Expected batches: ${expectedBatches} (${recentCampaign.totalRecipients} recipients / 100 per batch)`);
    console.log(`   Actual batches: ${recentCampaign.emailBatches.length}`);
    
    if (recentCampaign.emailBatches.length < expectedBatches) {
      console.log(`   ⚠️  Missing ${expectedBatches - recentCampaign.emailBatches.length} batch(es)!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBatches();

