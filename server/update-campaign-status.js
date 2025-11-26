require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function updateCampaignStatus() {
  try {
    // Find the campaign with status 'queued'
    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        status: 'queued'
      },
      include: {
        emailBatches: {
          select: {
            status: true,
            sentCount: true
          }
        }
      }
    });

    if (!campaign) {
      console.log('❌ No campaign found with status "queued"');
      process.exit(0);
    }

    console.log(`📧 Found campaign: "${campaign.name}"`);
    console.log(`   ID: ${campaign.id}`);
    console.log(`   Current status: ${campaign.status}`);
    console.log(`   Total Recipients: ${campaign.totalRecipients || 0}`);
    console.log(`   Total Sent: ${campaign.totalSent || 0}`);
    console.log(`   Batches: ${campaign.emailBatches.length}`);

    // Check if all batches are sent
    const allBatchesSent = campaign.emailBatches.every(b => b.status === 'sent' || b.status === 'failed');
    const sentBatches = campaign.emailBatches.filter(b => b.status === 'sent');
    const totalSentFromBatches = campaign.emailBatches.reduce((sum, b) => sum + (b.sentCount || 0), 0);

    console.log(`\n📊 Batch Status:`);
    console.log(`   All batches sent: ${allBatchesSent}`);
    console.log(`   Sent batches: ${sentBatches.length}/${campaign.emailBatches.length}`);
    console.log(`   Total sent from batches: ${totalSentFromBatches}`);

    if (allBatchesSent && totalSentFromBatches > 0) {
      // Update campaign status to 'sent'
      const updated = await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'sent',
          totalSent: totalSentFromBatches,
          sentAt: new Date()
        }
      });

      console.log(`\n✅ Campaign status updated to 'sent'`);
      console.log(`   Total Sent: ${updated.totalSent}`);
      console.log(`   Sent At: ${updated.sentAt}`);
    } else {
      console.log(`\n⚠️  Cannot update to 'sent' - not all batches are sent or no emails were sent`);
      if (!allBatchesSent) {
        console.log(`   Some batches are still pending or processing`);
      }
      if (totalSentFromBatches === 0) {
        console.log(`   No emails were sent (totalSentFromBatches = 0)`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateCampaignStatus();

