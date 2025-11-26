require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkCampaignDuplicates() {
  try {
    // Get the most recent campaign
    const recentCampaign = await prisma.emailCampaign.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        template: true
      }
    });

    if (!recentCampaign) {
      console.log('❌ No campaigns found');
      process.exit(0);
    }

    console.log(`📧 Campaign: "${recentCampaign.name}"`);
    console.log(`   Template ID: ${recentCampaign.templateId || 'None'}`);
    console.log(`   Total Recipients: ${recentCampaign.totalRecipients || 0}`);
    console.log(`   Total Sent: ${recentCampaign.totalSent || 0}\n`);

    // Check how many consumers already received this template
    if (recentCampaign.templateId) {
      const campaignsWithSameTemplate = await prisma.emailCampaign.findMany({
        where: {
          templateId: recentCampaign.templateId,
          status: { in: ['sent', 'sending', 'queued'] },
          id: { not: recentCampaign.id } // Exclude current campaign
        },
        select: {
          id: true,
          name: true
        }
      });

      console.log(`📋 Previous campaigns with same template: ${campaignsWithSameTemplate.length}`);
      campaignsWithSameTemplate.forEach(c => {
        console.log(`   - ${c.name} (${c.id.substring(0, 8)}...)`);
      });

      if (campaignsWithSameTemplate.length > 0) {
        const campaignIds = campaignsWithSameTemplate.map(c => c.id);
        const existingEvents = await prisma.emailEvent.findMany({
          where: {
            campaignId: { in: campaignIds },
            eventType: 'sent'
          },
          select: {
            consumerId: true
          }
        });

        const alreadySentSet = new Set(existingEvents.map(e => e.consumerId));
        console.log(`\n📊 Duplicate Check Results:`);
        console.log(`   Consumers who already received this template: ${alreadySentSet.size}`);
        console.log(`   Total recipients in campaign: ${recentCampaign.totalRecipients || 0}`);
        console.log(`   Expected to send: ${(recentCampaign.totalRecipients || 0) - alreadySentSet.size}`);
        console.log(`   Actually sent: ${recentCampaign.totalSent || 0}`);
      }
    }

    // Check email events for this campaign
    const emailEvents = await prisma.emailEvent.findMany({
      where: {
        campaignId: recentCampaign.id,
        eventType: 'sent'
      },
      select: {
        consumerId: true
      }
    });

    console.log(`\n📨 Email Events for this campaign:`);
    console.log(`   Sent events: ${emailEvents.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaignDuplicates();

