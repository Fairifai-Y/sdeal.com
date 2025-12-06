require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkCampaignBatchJobs() {
  try {
    console.log('🔍 Checking campaigns and batch creation jobs...\n');

    // Get all campaigns
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        emailBatches: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        batchCreationJobs: {
          select: {
            id: true,
            status: true,
            totalRecipients: true,
            processedCount: true,
            batchesCreated: true,
            currentChunk: true,
            errorMessage: true,
            createdAt: true,
            nextProcessAt: true
          }
        }
      }
    });

    console.log(`📊 Found ${campaigns.length} recent campaigns\n`);

    for (const campaign of campaigns) {
      console.log(`\n📧 Campaign: "${campaign.name}" (${campaign.id})`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Total Recipients: ${campaign.totalRecipients}`);
      console.log(`   Created: ${campaign.createdAt}`);
      
      // Check batch creation jobs
      if (campaign.batchCreationJobs && campaign.batchCreationJobs.length > 0) {
        console.log(`\n   📦 Batch Creation Jobs (${campaign.batchCreationJobs.length}):`);
        campaign.batchCreationJobs.forEach((job, idx) => {
          console.log(`      Job ${idx + 1}:`);
          console.log(`         Status: ${job.status}`);
          console.log(`         Progress: ${job.processedCount}/${job.totalRecipients} recipients`);
          console.log(`         Batches Created: ${job.batchesCreated}`);
          console.log(`         Current Chunk: ${job.currentChunk}`);
          if (job.errorMessage) {
            console.log(`         ❌ Error: ${job.errorMessage}`);
          }
          console.log(`         Next Process At: ${job.nextProcessAt || 'N/A'}`);
          console.log(`         Created: ${job.createdAt}`);
        });
      } else {
        console.log(`   ⚠️  No batch creation jobs found`);
      }

      // Check email batches
      if (campaign.emailBatches && campaign.emailBatches.length > 0) {
        console.log(`\n   📨 Email Batches (${campaign.emailBatches.length}):`);
        const statusCounts = {};
        campaign.emailBatches.forEach(batch => {
          statusCounts[batch.status] = (statusCounts[batch.status] || 0) + 1;
        });
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`      ${status}: ${count}`);
        });
      } else {
        console.log(`   ⚠️  No email batches found`);
      }
    }

    // Check for pending/processing batch creation jobs
    console.log(`\n\n🔍 Checking for pending/processing batch creation jobs...\n`);
    const pendingJobs = await prisma.batchCreationJob.findMany({
      where: {
        status: { in: ['pending', 'processing'] }
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (pendingJobs.length > 0) {
      console.log(`📦 Found ${pendingJobs.length} pending/processing jobs:\n`);
      pendingJobs.forEach((job, idx) => {
        console.log(`   Job ${idx + 1}:`);
        console.log(`      Campaign: "${job.campaign.name}" (${job.campaign.id})`);
        console.log(`      Status: ${job.status}`);
        console.log(`      Progress: ${job.processedCount}/${job.totalRecipients}`);
        console.log(`      Batches Created: ${job.batchesCreated}`);
        console.log(`      Next Process At: ${job.nextProcessAt || 'N/A'}`);
        if (job.errorMessage) {
          console.log(`      ❌ Error: ${job.errorMessage}`);
        }
      });
    } else {
      console.log(`✅ No pending/processing batch creation jobs found`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaignBatchJobs();

