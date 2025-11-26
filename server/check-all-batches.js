require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkAllBatches() {
  try {
    console.log('🔍 Checking all batches for recent campaigns...\n');

    // Get all recent campaigns
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        emailBatches: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            processedAt: true,
            sentCount: true,
            failedCount: true,
            errorMessage: true,
            emails: true
          }
        },
        template: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    for (const campaign of campaigns) {
      console.log(`\n📧 Campaign: "${campaign.name}"`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Template: ${campaign.template?.name || 'None'} (${campaign.templateId || 'N/A'})`);
      console.log(`   Total Recipients: ${campaign.totalRecipients || 0}`);
      console.log(`   Total Sent: ${campaign.totalSent || 0}`);
      console.log(`   Created: ${campaign.createdAt}`);
      console.log(`   Updated: ${campaign.updatedAt}`);
      
      if (campaign.errorMessage) {
        console.log(`   ⚠️  Error: ${campaign.errorMessage}`);
      }

      console.log(`\n📦 Batches: ${campaign.emailBatches.length}`);

      if (campaign.emailBatches.length > 0) {
        let totalEmailsInBatches = 0;
        const statusCounts = {};
        
        campaign.emailBatches.forEach(batch => {
          const emailsCount = Array.isArray(batch.emails) ? batch.emails.length : 0;
          totalEmailsInBatches += emailsCount;
          statusCounts[batch.status] = (statusCounts[batch.status] || 0) + 1;
        });

        console.log(`   Total emails in batches: ${totalEmailsInBatches}`);
        console.log(`\n   Status Summary:`);
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`     ${status}: ${count}`);
        });

        console.log(`\n   Batch Details:`);
        campaign.emailBatches.forEach((batch, index) => {
          const emailsCount = Array.isArray(batch.emails) ? batch.emails.length : 0;
          console.log(`   ${index + 1}. Batch ${batch.id.substring(0, 12)}...`);
          console.log(`      Status: ${batch.status}`);
          console.log(`      Emails: ${emailsCount}`);
          console.log(`      Sent Count: ${batch.sentCount || 0}`);
          console.log(`      Failed Count: ${batch.failedCount || 0}`);
          console.log(`      Created: ${batch.createdAt}`);
          if (batch.processedAt) {
            const duration = ((new Date(batch.processedAt) - new Date(batch.createdAt)) / 1000).toFixed(1);
            console.log(`      Processed: ${batch.processedAt} (${duration}s after creation)`);
          }
          if (batch.errorMessage) {
            console.log(`      ⚠️  Error: ${batch.errorMessage}`);
          }
        });

        // Analysis
        const expectedBatches = Math.ceil((campaign.totalRecipients || 0) / 100);
        console.log(`\n   📊 Analysis:`);
        console.log(`      Expected batches (${campaign.totalRecipients || 0} recipients / 100 per batch): ${expectedBatches}`);
        console.log(`      Actual batches: ${campaign.emailBatches.length}`);
        console.log(`      Total emails in batches: ${totalEmailsInBatches}`);
        console.log(`      Campaign totalSent: ${campaign.totalSent || 0}`);
        
        if (campaign.emailBatches.length < expectedBatches) {
          console.log(`      ⚠️  Missing batches! Should have ${expectedBatches} batches but only ${campaign.emailBatches.length} were created.`);
        }
        
        if (totalEmailsInBatches < (campaign.totalRecipients || 0)) {
          console.log(`      ⚠️  Missing emails! Should have ${campaign.totalRecipients || 0} emails but only ${totalEmailsInBatches} are in batches.`);
        }
        
        if ((campaign.totalSent || 0) < totalEmailsInBatches) {
          console.log(`      ℹ️  Still processing: ${totalEmailsInBatches - (campaign.totalSent || 0)} emails not yet sent.`);
        }
      } else {
        console.log('   ⚠️  No batches found for this campaign');
      }
    }

    // Overall statistics
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

    console.log(`\n\n📈 Overall Batch Statistics:`);
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

checkAllBatches();

