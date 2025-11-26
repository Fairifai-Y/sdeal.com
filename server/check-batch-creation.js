require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkBatchCreation() {
  try {
    console.log('🔍 Analyzing batch creation patterns...\n');
    
    // Get all batches with campaign info
    const batches = await prisma.emailBatch.findMany({
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            sentAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Get last 100 batches
    });

    console.log(`📊 Found ${batches.length} batches (showing last 100)\n`);

    // Group by campaign
    const batchesByCampaign = {};
    for (const batch of batches) {
      const campaignId = batch.campaignId;
      if (!batchesByCampaign[campaignId]) {
        batchesByCampaign[campaignId] = {
          campaign: batch.campaign,
          batches: [],
          statuses: {}
        };
      }
      batchesByCampaign[campaignId].batches.push(batch);
      const status = batch.status;
      batchesByCampaign[campaignId].statuses[status] = (batchesByCampaign[campaignId].statuses[status] || 0) + 1;
    }

    // Analyze each campaign
    for (const [campaignId, data] of Object.entries(batchesByCampaign)) {
      const campaign = data.campaign;
      const campaignBatches = data.batches;
      
      console.log(`\n📧 Campaign: ${campaign.name} (${campaignId})`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Created: ${campaign.createdAt}`);
      console.log(`   Sent: ${campaign.sentAt || 'Not sent yet'}`);
      console.log(`   Total Batches: ${campaignBatches.length}`);
      console.log(`   Batch Statuses:`, data.statuses);
      
      // Check for suspicious patterns
      const recentBatches = campaignBatches.filter(b => {
        const batchAge = Date.now() - new Date(b.createdAt).getTime();
        return batchAge < 3600000; // Last hour
      });
      
      if (recentBatches.length > 0 && campaign.status === 'sent') {
        console.log(`   ⚠️  WARNING: ${recentBatches.length} batch(es) created in last hour for a SENT campaign!`);
      }
      
      // Check for duplicate creation times
      const creationTimes = campaignBatches.map(b => b.createdAt.toISOString());
      const uniqueTimes = new Set(creationTimes);
      if (creationTimes.length !== uniqueTimes.size) {
        console.log(`   ⚠️  WARNING: Multiple batches created at the same time (possible duplicate creation)`);
      }
      
      // Show batch details
      const sortedBatches = campaignBatches.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      console.log(`   Batch Timeline:`);
      for (let i = 0; i < Math.min(5, sortedBatches.length); i++) {
        const batch = sortedBatches[i];
        const emailCount = Array.isArray(batch.emails) ? batch.emails.length : 0;
        console.log(`     ${i + 1}. Created: ${batch.createdAt.toISOString()}, Status: ${batch.status}, Emails: ${emailCount}`);
      }
      if (sortedBatches.length > 5) {
        console.log(`     ... and ${sortedBatches.length - 5} more batches`);
      }
    }

    // Check for batches created without user action (check last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBatches = batches.filter(b => new Date(b.createdAt) > oneDayAgo);
    
    console.log(`\n\n📈 Recent Activity (last 24 hours):`);
    console.log(`   Total batches created: ${recentBatches.length}`);
    
    // Group by hour
    const batchesByHour = {};
    for (const batch of recentBatches) {
      const hour = new Date(batch.createdAt).toISOString().substring(0, 13) + ':00';
      batchesByHour[hour] = (batchesByHour[hour] || 0) + 1;
    }
    
    console.log(`   Batches by hour:`);
    for (const [hour, count] of Object.entries(batchesByHour).sort()) {
      console.log(`     ${hour}: ${count} batch(es)`);
    }

    // Check for pending batches that might be retried
    const pendingBatches = await prisma.emailBatch.findMany({
      where: {
        status: 'pending',
        nextRetryAt: { lte: new Date() }
      },
      include: {
        campaign: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });

    if (pendingBatches.length > 0) {
      console.log(`\n⚠️  Found ${pendingBatches.length} pending batch(es) ready for retry:`);
      for (const batch of pendingBatches) {
        console.log(`   - Batch ${batch.id.substring(0, 8)}... for campaign "${batch.campaign.name}" (status: ${batch.campaign.status})`);
        console.log(`     Retry count: ${batch.retryCount}/${batch.maxRetries}, Next retry: ${batch.nextRetryAt}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBatchCreation();

