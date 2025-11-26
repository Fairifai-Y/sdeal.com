require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkCampaignBatches() {
  try {
    console.log('🔍 Checking batches for recent campaigns...\n');

    // Get the most recent campaign
    const recentCampaign = await prisma.emailCampaign.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        emailBatches: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            processedAt: true,
            sentCount: true,
            failedCount: true,
            errorMessage: true
          }
        },
        _count: {
          select: {
            emailBatches: true
          }
        }
      }
    });

    if (!recentCampaign) {
      console.log('❌ No campaigns found');
      process.exit(0);
    }

    console.log(`📧 Campaign: "${recentCampaign.name}"`);
    console.log(`   ID: ${recentCampaign.id}`);
    console.log(`   Status: ${recentCampaign.status}`);
    console.log(`   Total Recipients: ${recentCampaign.totalRecipients || 0}`);
    console.log(`   Total Sent: ${recentCampaign.totalSent || 0}`);
    console.log(`   Created: ${recentCampaign.createdAt}`);
    console.log(`\n📦 Batches: ${recentCampaign._count.emailBatches}`);

    if (recentCampaign.emailBatches.length > 0) {
      console.log('\n📊 Batch Details:');
      
      const statusCounts = {};
      recentCampaign.emailBatches.forEach(batch => {
        statusCounts[batch.status] = (statusCounts[batch.status] || 0) + 1;
      });

      console.log('\n   Status Summary:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });

      console.log('\n   Individual Batches:');
      recentCampaign.emailBatches.forEach((batch, index) => {
        const emailsCount = Array.isArray(batch.emails) ? batch.emails.length : 'unknown';
        console.log(`   ${index + 1}. Batch ${batch.id.substring(0, 8)}...`);
        console.log(`      Status: ${batch.status}`);
        console.log(`      Emails: ${emailsCount}`);
        console.log(`      Sent: ${batch.sentCount || 0}`);
        console.log(`      Failed: ${batch.failedCount || 0}`);
        if (batch.processedAt) {
          console.log(`      Processed: ${batch.processedAt}`);
        }
        if (batch.errorMessage) {
          console.log(`      Error: ${batch.errorMessage}`);
        }
        console.log('');
      });
    } else {
      console.log('   ⚠️  No batches found for this campaign');
    }

    // Also check all pending/processing batches across all campaigns
    const allPendingBatches = await prisma.emailBatch.count({
      where: {
        status: { in: ['pending', 'processing'] }
      }
    });

    const allSentBatches = await prisma.emailBatch.count({
      where: {
        status: 'sent'
      }
    });

    const allFailedBatches = await prisma.emailBatch.count({
      where: {
        status: 'failed'
      }
    });

    console.log('\n📈 Overall Batch Statistics:');
    console.log(`   Pending/Processing: ${allPendingBatches}`);
    console.log(`   Sent: ${allSentBatches}`);
    console.log(`   Failed: ${allFailedBatches}`);
    console.log(`   Total: ${allPendingBatches + allSentBatches + allFailedBatches}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaignBatches();

