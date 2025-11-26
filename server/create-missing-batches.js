require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

// Helper functions (copied from campaigns.js)
function replaceTemplateVariables(template, consumer) {
  if (!template) return '';
  
  return template
    .replace(/\{\{firstName\}\}/g, consumer.firstName || '')
    .replace(/\{\{lastName\}\}/g, consumer.lastName || '')
    .replace(/\{\{email\}\}/g, consumer.email || '')
    .replace(/\{\{store\}\}/g, consumer.store || '')
    .replace(/\{\{country\}\}/g, consumer.country || '')
    .replace(/\{\{phone\}\}/g, consumer.phone || '');
}

function wrapEmailTemplate(content) {
  // Check if content is already wrapped
  if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
    return content;
  }
  
  // Basic email template wrapper
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 20px; background-color: #ffffff; border-bottom: 1px solid #eeeeee;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%">
                    <img src="https://www.sdeal.com/images/logo.png" alt="SDeal" style="max-width: 150px; height: auto;">
                  </td>
                  <td width="50%" align="right">
                    <img src="https://www.sdeal.com/images/smiley.png" alt="Smiley" style="max-width: 50px; height: auto;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                Met vriendelijke groet,<br>
                <strong>Het SDeal Team</strong>
              </p>
              <img src="https://www.sdeal.com/images/smiley.png" alt="Smiley" style="max-width: 50px; height: auto; margin: 10px 0;">
              <p style="margin: 20px 0 0 0; font-size: 12px; color: #999999;">
                SDeal - Exclusieve Deals<br>
                <a href="{{unsubscribeUrl}}" style="color: #999999; text-decoration: underline;">Afmelden</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function formatFromEmail(email) {
  if (!email) return email;
  if (email.includes('<') && email.includes('>')) {
    return email;
  }
  return `SDeal – Exclusieve Deals <${email}>`;
}

async function createMissingBatches(campaignId) {
  try {
    // Get campaign with template
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        emailBatches: true
      }
    });

    if (!campaign) {
      console.log(`Campaign ${campaignId} not found`);
      return;
    }

    if (!campaign.template) {
      console.log(`Campaign ${campaignId} has no template`);
      return;
    }

    console.log(`\n📊 Campaign: ${campaign.name} (${campaign.id})`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Total Recipients: ${campaign.totalRecipients}`);
    console.log(`   Existing Batches: ${campaign.emailBatches.length}`);

    // Get recipients from filterCriteria
    let recipients = [];
    
    if (campaign.filterCriteria && campaign.filterCriteria.listId) {
      const listMembers = await prisma.emailListMember.findMany({
        where: {
          listId: campaign.filterCriteria.listId,
          status: 'subscribed'
        },
        include: {
          consumer: true
        }
      });
      recipients = listMembers.map(m => m.consumer).filter(c => c && !c.isUnsubscribed);
    } else {
      console.log('No listId in filterCriteria, cannot determine recipients');
      return;
    }

    // Filter out already sent
    const existingEvents = await prisma.emailEvent.findMany({
      where: {
        campaignId: campaignId,
        eventType: 'sent'
      },
      select: {
        consumerId: true
      }
    });
    
    const alreadySentSet = new Set(existingEvents.map(e => e.consumerId));
    const recipientsToSend = recipients.filter(consumer => !alreadySentSet.has(consumer.id));
    
    console.log(`   Recipients to send: ${recipientsToSend.length}`);

    // Get already batched consumer IDs
    const batchedConsumerIds = new Set();
    for (const batch of campaign.emailBatches) {
      if (Array.isArray(batch.emails)) {
        for (const email of batch.emails) {
          if (email.consumerId) {
            batchedConsumerIds.add(email.consumerId);
          }
        }
      }
    }

    // Filter out already batched
    const recipientsToBatch = recipientsToSend.filter(consumer => !batchedConsumerIds.has(consumer.id));
    
    console.log(`   Recipients to batch: ${recipientsToBatch.length}`);

    if (recipientsToBatch.length === 0) {
      console.log('✅ All recipients are already batched');
      return;
    }

    // Create batches
    const BATCH_SIZE = 100;
    const template = campaign.template;
    let batchNumber = campaign.emailBatches.length;
    let totalCreated = 0;

    for (let i = 0; i < recipientsToBatch.length; i += BATCH_SIZE) {
      const batchRecipients = recipientsToBatch.slice(i, i + BATCH_SIZE);
      const emailMessages = [];
      
      for (const consumer of batchRecipients) {
        try {
          const subject = replaceTemplateVariables(campaign.subject || template.subject, consumer);
          let htmlContent = replaceTemplateVariables(template.htmlContent, consumer);
          htmlContent = wrapEmailTemplate(htmlContent);
          const unsubscribeUrl = `${process.env.BASE_URL || 'https://www.sdeal.com'}/unsubscribe?email=${encodeURIComponent(consumer.email)}&token=${consumer.id}`;
          htmlContent = htmlContent.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
          
          const textContent = template.textContent 
            ? replaceTemplateVariables(template.textContent, consumer)
            : null;

          emailMessages.push({
            to: consumer.email,
            from: formatFromEmail(process.env.FROM_EMAIL),
            subject: subject,
            html: htmlContent,
            text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
            consumerId: consumer.id,
            customArgs: {
              campaignId: campaignId,
              consumerId: consumer.id
            }
          });
        } catch (error) {
          console.error(`Error preparing email for ${consumer.email}:`, error.message);
        }
      }

      if (emailMessages.length > 0) {
        await prisma.emailBatch.create({
          data: {
            campaignId: campaignId,
            emails: emailMessages,
            status: 'pending',
            priority: 0
          }
        });
        
        batchNumber++;
        totalCreated++;
        console.log(`✅ Created batch ${batchNumber} with ${emailMessages.length} emails`);
      }
    }

    console.log(`\n✅ Created ${totalCreated} missing batch(es)`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get campaign ID from command line or use most recent
const campaignId = process.argv[2];

if (campaignId) {
  createMissingBatches(campaignId);
} else {
  // Get most recent campaign
  prisma.emailCampaign.findFirst({
    orderBy: { createdAt: 'desc' }
  }).then(campaign => {
    if (campaign) {
      console.log(`Using most recent campaign: ${campaign.id}`);
      createMissingBatches(campaign.id);
    } else {
      console.log('No campaigns found');
      process.exit(1);
    }
  });
}

