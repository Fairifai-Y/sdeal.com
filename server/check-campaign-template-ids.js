require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkCampaignTemplateIds() {
  try {
    console.log('🔍 Checking campaigns and their templateIds...\n');
    
    // Get all campaigns
    const campaigns = await prisma.emailCampaign.findMany({
      include: {
        template: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            emailEvents: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total campaigns: ${campaigns.length}\n`);

    let withTemplateId = 0;
    let withoutTemplateId = 0;
    let sentCampaigns = 0;
    let sentWithTemplateId = 0;
    let sentWithoutTemplateId = 0;

    for (const campaign of campaigns) {
      const hasTemplateId = !!campaign.templateId;
      const isSent = campaign.status === 'sent';
      
      if (hasTemplateId) {
        withTemplateId++;
        if (isSent) sentWithTemplateId++;
      } else {
        withoutTemplateId++;
        if (isSent) sentWithoutTemplateId++;
      }
      
      if (isSent) sentCampaigns++;

      console.log(`Campaign: ${campaign.name}`);
      console.log(`  ID: ${campaign.id}`);
      console.log(`  Status: ${campaign.status}`);
      console.log(`  TemplateId: ${campaign.templateId || '❌ MISSING'}`);
      console.log(`  Template Name: ${campaign.template?.name || 'N/A'}`);
      console.log(`  Email Events: ${campaign._count.emailEvents}`);
      console.log(`  Created: ${campaign.createdAt}`);
      console.log('');
    }

    console.log('\n📈 Summary:');
    console.log(`  Total campaigns: ${campaigns.length}`);
    console.log(`  With templateId: ${withTemplateId}`);
    console.log(`  Without templateId: ${withoutTemplateId}`);
    console.log(`  Sent campaigns: ${sentCampaigns}`);
    console.log(`  Sent with templateId: ${sentWithTemplateId} ✅ (will work with new duplicate check)`);
    console.log(`  Sent without templateId: ${sentWithoutTemplateId} ⚠️  (will only check this campaign)`);

    if (sentWithoutTemplateId > 0) {
      console.log('\n⚠️  WARNING: Some sent campaigns are missing templateId.');
      console.log('   These campaigns will only check for duplicates within themselves,');
      console.log('   not across campaigns with the same template.');
      console.log('\n   To fix: Update these campaigns to include templateId.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaignTemplateIds();

