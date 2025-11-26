require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function analyzeBatchTiming() {
  try {
    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        name: 'Lifetime discount group',
        templateId: 'cmib96doh0000icaclf98ruc8' // NL template
      },
      include: {
        emailBatches: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!campaign) {
      console.log('❌ Campaign not found');
      process.exit(0);
    }

    console.log(`📧 Campaign: "${campaign.name}"`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Total Recipients: ${campaign.totalRecipients}`);
    console.log(`   Total Sent: ${campaign.totalSent}`);
    console.log(`   Created: ${campaign.createdAt}`);
    console.log(`\n📦 Batch Creation Timeline:\n`);

    const batches = campaign.emailBatches;
    let previousTime = new Date(campaign.createdAt);

    batches.forEach((batch, index) => {
      const batchCreated = new Date(batch.createdAt);
      const batchProcessed = batch.processedAt ? new Date(batch.processedAt) : null;
      const timeSinceCampaign = ((batchCreated - previousTime) / 1000 / 60).toFixed(1);
      const timeSincePrevious = index > 0 ? ((batchCreated - new Date(batches[index - 1].createdAt)) / 1000 / 60).toFixed(1) : '0.0';
      const processingTime = batchProcessed ? ((batchProcessed - batchCreated) / 1000).toFixed(1) : 'N/A';
      
      console.log(`Batch ${index + 1}:`);
      console.log(`   Created: ${batch.createdAt} (${timeSincePrevious} min after previous)`);
      console.log(`   Status: ${batch.status}`);
      console.log(`   Emails: ${Array.isArray(batch.emails) ? batch.emails.length : 'unknown'}`);
      console.log(`   Sent: ${batch.sentCount || 0}`);
      if (batchProcessed) {
        console.log(`   Processed: ${batchProcessed} (${processingTime}s after creation)`);
      }
      console.log('');
      
      previousTime = batchCreated;
    });

    console.log(`\n📊 Observations:`);
    console.log(`   Total batches: ${batches.length}`);
    console.log(`   Total time from first to last batch: ${((new Date(batches[batches.length - 1].createdAt) - new Date(batches[0].createdAt)) / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Campaign status: ${campaign.status} (should be 'sent' if all batches are sent)`);
    
    if (campaign.status !== 'sent' && batches.every(b => b.status === 'sent')) {
      console.log(`   ⚠️  Campaign status should be 'sent' but is '${campaign.status}'`);
    }

    // Check if batches were created incrementally (not all at once)
    const timeBetweenBatches = [];
    for (let i = 1; i < batches.length; i++) {
      const timeDiff = (new Date(batches[i].createdAt) - new Date(batches[i - 1].createdAt)) / 1000 / 60;
      timeBetweenBatches.push(timeDiff);
    }
    
    const avgTimeBetween = timeBetweenBatches.reduce((a, b) => a + b, 0) / timeBetweenBatches.length;
    console.log(`   Average time between batches: ${avgTimeBetween.toFixed(1)} minutes`);
    
    if (avgTimeBetween > 2) {
      console.log(`   ⚠️  Batches were created incrementally, not all at once!`);
      console.log(`   This suggests the batch creation function may have been interrupted or timed out.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeBatchTiming();

