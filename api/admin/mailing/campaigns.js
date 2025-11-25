const prisma = require('../../lib/prisma-with-retry');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('[Campaign] SendGrid initialized');
} else {
  console.warn('[Campaign] SENDGRID_API_KEY not found in environment variables');
}

// Helper function to format from email with display name
function formatFromEmail(email) {
  if (!email) return email;
  // If email already contains a display name (format: "Name <email>"), return as is
  if (email.includes('<') && email.includes('>')) {
    return email;
  }
  // Add display name: "SDeal – Exclusieve Deals <email>"
  return `SDeal – Exclusieve Deals <${email}>`;
}

// Helper function to replace template variables
function replaceTemplateVariables(content, consumer) {
  if (!content || !consumer) return content;
  
  let result = content;
  // Replace common variables
  result = result.replace(/\{\{firstName\}\}/g, consumer.firstName || '');
  result = result.replace(/\{\{lastName\}\}/g, consumer.lastName || '');
  result = result.replace(/\{\{email\}\}/g, consumer.email || '');
  result = result.replace(/\{\{store\}\}/g, consumer.store || '');
  result = result.replace(/\{\{country\}\}/g, consumer.country || '');
  result = result.replace(/\{\{phone\}\}/g, consumer.phone || '');
  
  // Replace any other variables from consumer object
  Object.keys(consumer).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, consumer[key] || '');
  });
  
  return result;
}

// Helper function to wrap content in a complete HTML email template
function wrapEmailTemplate(content) {
  // Check if content already has full HTML structure
  if (content && content.trim().toLowerCase().startsWith('<!doctype') || 
      (content && content.includes('<html') && content.includes('</html>'))) {
    return content; // Already a complete HTML document
  }

  // Wrap in a responsive email template with inline styles (for email client compatibility)
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; line-height: 1.6; color: #333333;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: #ffffff; border-bottom: 1px solid #eeeeee;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="${process.env.BASE_URL || 'https://www.sdeal.com'}/images/logo_sdeal_navbar.svg" alt="SDeal Logo" style="height: 40px; width: auto; display: block;" />
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <img src="${process.env.BASE_URL || 'https://www.sdeal.com'}/images/smiley_sdeal.png" alt="SDeal" style="height: 40px; width: auto; display: block; margin-left: auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #333333;">
                Met vriendelijke groet,<br>
                <strong>Het SDeal Team</strong>
              </p>
              <p style="margin: 0 0 20px 0;">
                <img src="${process.env.BASE_URL || 'https://www.sdeal.com'}/images/smiley_sdeal.png" alt="SDeal" style="height: 50px; width: auto; display: block; margin: 0 auto;" />
              </p>
              <p style="margin: 0 0 10px 0;">
                <strong>SDeal B.V.</strong><br>
                Osloweg 110, 9723 BX Groningen, The Netherlands<br>
                KVK: 76103080 | VAT: NL 860508468B01
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="https://www.sdeal.com" style="color: #0066cc; text-decoration: none;">www.sdeal.com</a> | 
                <a href="mailto:info@sdeal.com" style="color: #0066cc; text-decoration: none;">info@sdeal.com</a>
              </p>
              <p style="margin: 20px 0 0 0; font-size: 11px; color: #999999;">
                <a href="{{unsubscribeUrl}}" style="color: #999999; text-decoration: underline;">Afmelden</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - List all campaigns or get single campaign
    if (req.method === 'GET') {
      const { id, status, page = 1, pageSize = 50 } = req.query;

      if (id) {
        const campaign = await prisma.emailCampaign.findUnique({
          where: { id },
          include: {
            template: true,
            consumer: true,
            _count: {
              select: {
                emailEvents: true
              }
            }
          }
        });

        if (!campaign) {
          return res.status(404).json({
            success: false,
            error: 'Campaign not found'
          });
        }

        return res.json({
          success: true,
          data: campaign
        });
      }

      const where = {};
      if (status) where.status = status;

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const [campaigns, total] = await Promise.all([
        prisma.emailCampaign.findMany({
          where,
          skip,
          take,
          include: {
            template: true,
            consumer: true,
            _count: {
              select: {
                emailEvents: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.emailCampaign.count({ where })
      ]);

      return res.json({
        success: true,
        data: {
          campaigns,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize))
          }
        }
      });
    }

    // POST - Create new campaign or send campaign
    if (req.method === 'POST') {
      const { action, id, ...campaignData } = req.body;

      // Send campaign action
      if (action === 'send' && id) {
        const campaign = await prisma.emailCampaign.findUnique({
          where: { id },
          include: {
            template: true
          }
        });

        if (!campaign) {
          return res.status(404).json({
            success: false,
            error: 'Campaign not found'
          });
        }

        if (campaign.status === 'sending' || campaign.status === 'sent') {
          return res.status(400).json({
            success: false,
            error: 'Campaign is already sent or being sent'
          });
        }

        if (!campaign.templateId) {
          return res.status(400).json({
            success: false,
            error: 'Campaign must have a template to send'
          });
        }

        // Get recipients from filterCriteria (listId or other filters)
        const filterCriteria = campaign.filterCriteria || {};
        let recipients = [];

        if (filterCriteria.listId) {
          // Get consumers from list (only subscribed members who haven't unsubscribed globally)
          const listMembers = await prisma.emailListMember.findMany({
            where: {
              listId: filterCriteria.listId,
              status: 'subscribed',
              consumer: {
                isUnsubscribed: false
              }
            },
            include: {
              consumer: true
            }
          });
          recipients = listMembers.map(member => member.consumer);
        } else if (filterCriteria.store || filterCriteria.country) {
          // Get consumers by store/country
          const where = {
            isUnsubscribed: false
          };
          if (filterCriteria.store) where.store = filterCriteria.store;
          if (filterCriteria.country) where.country = filterCriteria.country;
          
          recipients = await prisma.consumer.findMany({ where });
        } else {
          // Get all active consumers
          recipients = await prisma.consumer.findMany({
            where: {
              isUnsubscribed: false
            }
          });
        }

        // Filter out consumers without email
        recipients = recipients.filter(c => c.email && c.email.includes('@'));

        // Update campaign status and recipient count
        const updatedCampaign = await prisma.emailCampaign.update({
          where: { id },
          data: {
            status: 'sending',
            totalRecipients: recipients.length,
            sentAt: new Date()
          }
        });

        // Start sending emails in background
        console.log(`[Campaign] Starting to send campaign ${id} to ${recipients.length} recipients`);

        // Send emails asynchronously (don't wait for completion)
        sendCampaignEmails(id, campaign, recipients).catch(error => {
          console.error(`[Campaign] Error sending campaign emails:`, error);
          // Update campaign status to error
          prisma.emailCampaign.update({
            where: { id },
            data: {
              status: 'error',
              errorMessage: error.message
            }
          }).catch(updateError => {
            console.error(`[Campaign] Error updating campaign status:`, updateError);
          });
        });

        return res.json({
          success: true,
          message: `Campaign is being sent to ${recipients.length} recipients`,
          data: {
            ...updatedCampaign,
            recipientCount: recipients.length
          }
        });
      }

      // Create new campaign
      const { name, subject, templateId, listId, scheduledAt, filterCriteria, consumerId } = campaignData;

      if (!name || !subject) {
        return res.status(400).json({
          success: false,
          error: 'name and subject are required'
        });
      }

      // Build filterCriteria from listId or provided criteria
      let finalFilterCriteria = filterCriteria || {};
      if (listId) {
        finalFilterCriteria = { ...finalFilterCriteria, listId };
      }

      const campaign = await prisma.emailCampaign.create({
        data: {
          name,
          subject,
          templateId: templateId || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          filterCriteria: finalFilterCriteria ? JSON.parse(JSON.stringify(finalFilterCriteria)) : null,
          consumerId: consumerId || null,
          status: scheduledAt ? 'scheduled' : 'draft'
        },
        include: {
          template: true,
          consumer: true
        }
      });

      return res.json({
        success: true,
        data: campaign
      });
    }

    // PUT - Update campaign
    if (req.method === 'PUT') {
      const { id, listId, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Campaign ID is required'
        });
      }

      // Handle listId in filterCriteria
      if (listId !== undefined) {
        updateData.filterCriteria = updateData.filterCriteria || {};
        if (listId) {
          updateData.filterCriteria.listId = listId;
        } else {
          delete updateData.filterCriteria.listId;
        }
      }

      // Handle JSON fields and dates
      if (updateData.filterCriteria && typeof updateData.filterCriteria === 'object') {
        updateData.filterCriteria = JSON.parse(JSON.stringify(updateData.filterCriteria));
      }
      if (updateData.scheduledAt) {
        updateData.scheduledAt = new Date(updateData.scheduledAt);
      }

      const campaign = await prisma.emailCampaign.update({
        where: { id },
        data: updateData,
        include: {
          template: true,
          consumer: true
        }
      });

      return res.json({
        success: true,
        data: campaign
      });
    }

    // DELETE - Delete campaign
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Campaign ID is required'
        });
      }

      await prisma.emailCampaign.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in campaigns API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// Function to send campaign emails
// Note: Retry logic for database operations is now handled automatically by prisma-with-retry
async function sendCampaignEmails(campaignId, campaign, recipients) {
  const startTime = Date.now();
  console.log(`[Campaign] 🚀 Starting email sending for campaign ${campaignId} with ${recipients.length} recipients`);
  
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    if (!process.env.FROM_EMAIL) {
      throw new Error('FROM_EMAIL not configured');
    }

    if (!campaign.template) {
      throw new Error('Campaign template not found');
    }

  const template = campaign.template;
  let totalSent = 0;
  let totalFailed = 0;
  let totalSkipped = 0; // Count of emails skipped because already sent

  // Optimized batch configuration for large campaigns
  // SendGrid supports up to 1000 recipients per request, but we use smaller batches
  // to avoid overwhelming the database and to allow progress updates
  // SendGrid rate limit: ~100 requests/second (Pro plan), so we use 100 emails per batch with 1s delay = 100 emails/second (safe)
  const SENDGRID_BATCH_SIZE = 100; // SendGrid batch size (emails per API call)
  const PROCESSING_BATCH_SIZE = 500; // Process 500 recipients at a time (check duplicates, prepare emails)
  const DELAY_BETWEEN_SENDGRID_BATCHES = 1000; // 1 second between SendGrid API calls (prevents rate limiting)
  const DELAY_BETWEEN_PROCESSING_BATCHES = 1000; // 1 second between processing batches

  console.log(`[Campaign] Starting to send ${recipients.length} emails using optimized batch sending`);

  // First, check which recipients have already received this campaign (bulk check)
  console.log(`[Campaign] Checking for duplicate sends...`);
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
  console.log(`[Campaign] Found ${alreadySentSet.size} recipients who already received this campaign`);

  // Filter out recipients who already received the campaign
  const recipientsToSend = recipients.filter(consumer => !alreadySentSet.has(consumer.id));
  totalSkipped = recipients.length - recipientsToSend.length;
  
  console.log(`[Campaign] Will send to ${recipientsToSend.length} recipients (${totalSkipped} skipped)`);

  // Process recipients in batches
  for (let i = 0; i < recipientsToSend.length; i += PROCESSING_BATCH_SIZE) {
    const processingBatch = recipientsToSend.slice(i, i + PROCESSING_BATCH_SIZE);
    console.log(`[Campaign] Processing batch ${Math.floor(i / PROCESSING_BATCH_SIZE) + 1}/${Math.ceil(recipientsToSend.length / PROCESSING_BATCH_SIZE)} (${processingBatch.length} recipients)`);
    
    // Prepare all emails in this batch
    const emailMessages = [];
    const emailEventsToCreate = [];
    const consumersToUpdate = [];
    
    for (const consumer of processingBatch) {
      try {
        // Replace template variables
        const subject = replaceTemplateVariables(campaign.subject || template.subject, consumer);
        let htmlContent = replaceTemplateVariables(template.htmlContent, consumer);
        
        // Wrap content in email template if not already wrapped
        htmlContent = wrapEmailTemplate(htmlContent);
        
        // Replace unsubscribe URL in the wrapped template
        const unsubscribeUrl = `${process.env.BASE_URL || 'https://www.sdeal.com'}/unsubscribe?email=${encodeURIComponent(consumer.email)}&token=${consumer.id}`;
        htmlContent = htmlContent.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
        
        const textContent = template.textContent 
          ? replaceTemplateVariables(template.textContent, consumer)
          : null;

        // Create email message for SendGrid batch sending
        emailMessages.push({
          to: consumer.email,
          from: formatFromEmail(process.env.FROM_EMAIL),
          subject: subject,
          html: htmlContent,
          text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
          customArgs: {
            campaignId: campaignId,
            consumerId: consumer.id
          }
        });

        // Prepare database records for bulk insert
        emailEventsToCreate.push({
          campaignId: campaignId,
          consumerId: consumer.id,
          eventType: 'sent',
          occurredAt: new Date()
        });

        consumersToUpdate.push(consumer.id);

      } catch (error) {
        console.error(`[Campaign] Error preparing email for ${consumer.email}:`, error.message);
        totalFailed++;
      }
    }

    // Send emails in SendGrid batches (up to 1000 per request, but we use 100 for safety)
    const totalSendGridBatches = Math.ceil(emailMessages.length / SENDGRID_BATCH_SIZE);
    console.log(`[Campaign] Processing batch ${Math.floor(i / PROCESSING_BATCH_SIZE) + 1}: Preparing to send ${emailMessages.length} emails in ${totalSendGridBatches} SendGrid batches`);
    
    for (let j = 0; j < emailMessages.length; j += SENDGRID_BATCH_SIZE) {
      const sendGridBatch = emailMessages.slice(j, j + SENDGRID_BATCH_SIZE);
      const batchEvents = emailEventsToCreate.slice(j, j + SENDGRID_BATCH_SIZE);
      const batchConsumerIds = consumersToUpdate.slice(j, j + SENDGRID_BATCH_SIZE);
      const batchNumber = Math.floor(j / SENDGRID_BATCH_SIZE) + 1;
      
      console.log(`[Campaign] Sending SendGrid batch ${batchNumber}/${totalSendGridBatches} (${sendGridBatch.length} emails)...`);
      
      const batchStartTime = Date.now();
      try {
        // Send batch via SendGrid (can send multiple emails in one API call)
        console.log(`[Campaign] [${new Date().toISOString()}] Sending SendGrid batch ${batchNumber}/${totalSendGridBatches}...`);
        const sendGridResponse = await sgMail.send(sendGridBatch);
        const sendGridDuration = ((Date.now() - batchStartTime) / 1000).toFixed(2);
        
        if (sendGridResponse && sendGridResponse[0]) {
          console.log(`[Campaign] [${new Date().toISOString()}] SendGrid batch ${batchNumber} response (${sendGridDuration}s): ${sendGridResponse[0].statusCode} ${sendGridResponse[0].statusMessage || ''}`);
        } else {
          console.log(`[Campaign] [${new Date().toISOString()}] SendGrid batch ${batchNumber} sent successfully in ${sendGridDuration}s (no response details)`);
        }
        
        // Bulk create email events
        const dbStartTime = Date.now();
        if (batchEvents.length > 0) {
          await prisma.emailEvent.createMany({
            data: batchEvents,
            skipDuplicates: true
          });
          const dbDuration = ((Date.now() - dbStartTime) / 1000).toFixed(2);
          console.log(`[Campaign] [${new Date().toISOString()}] Created ${batchEvents.length} email events for batch ${batchNumber} in ${dbDuration}s`);
        }

        // Bulk update consumers (update lastContactAt)
        if (batchConsumerIds.length > 0) {
          const updateStartTime = Date.now();
          await prisma.consumer.updateMany({
            where: {
              id: { in: batchConsumerIds }
            },
            data: {
              lastContactAt: new Date()
            }
          });
          const updateDuration = ((Date.now() - updateStartTime) / 1000).toFixed(2);
          console.log(`[Campaign] [${new Date().toISOString()}] Updated lastContactAt for ${batchConsumerIds.length} consumers in batch ${batchNumber} in ${updateDuration}s`);
        }

        totalSent += sendGridBatch.length;
        const totalDuration = ((Date.now() - batchStartTime) / 1000).toFixed(2);
        console.log(`[Campaign] [${new Date().toISOString()}] ✅ Batch ${batchNumber}/${totalSendGridBatches} completed in ${totalDuration}s: ${totalSent}/${recipientsToSend.length} total emails sent`);

        // Small delay between SendGrid batches to avoid rate limiting
        if (j + SENDGRID_BATCH_SIZE < emailMessages.length) {
          console.log(`[Campaign] Waiting ${DELAY_BETWEEN_SENDGRID_BATCHES}ms before next SendGrid batch...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_SENDGRID_BATCHES));
        }

      } catch (error) {
        // If batch send fails, try individual sends for this batch
        const errorDuration = ((Date.now() - batchStartTime) / 1000).toFixed(2);
        console.error(`[Campaign] [${new Date().toISOString()}] ❌ Batch ${batchNumber} send failed after ${errorDuration}s:`, error.message);
        console.error(`[Campaign] Error stack:`, error.stack);
        console.log(`[Campaign] [${new Date().toISOString()}] Trying individual sends for batch ${batchNumber}...`);
        
        for (let k = 0; k < sendGridBatch.length; k++) {
          try {
            await sgMail.send(sendGridBatch[k]);
            await prisma.emailEvent.create({
              data: batchEvents[k]
            });
            await prisma.consumer.update({
              where: { id: batchConsumerIds[k] },
              data: { lastContactAt: new Date() }
            });
            totalSent++;
          } catch (individualError) {
            totalFailed++;
            console.error(`[Campaign] Failed to send email to ${sendGridBatch[k].to}:`, individualError.message);
            
            // Record bounce event
            try {
              await prisma.emailEvent.create({
                data: {
                  campaignId: campaignId,
                  consumerId: batchConsumerIds[k],
                  eventType: 'bounced',
                  bounceType: 'hard',
                  bounceReason: individualError.message,
                  occurredAt: new Date()
                }
              });
            } catch (eventError) {
              console.error(`[Campaign] Error creating bounce event:`, eventError);
            }
          }
        }
      }
    }

    // Update campaign progress after each processing batch
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          totalSent: totalSent,
          totalBounced: totalFailed
        }
      });
      console.log(`[Campaign] ✅ Processing batch ${Math.floor(i / PROCESSING_BATCH_SIZE) + 1} completed. Progress saved: ${totalSent} sent, ${totalFailed} failed`);
    } catch (updateError) {
      console.error(`[Campaign] Error updating campaign progress:`, updateError);
    }

    // Delay between processing batches
    if (i + PROCESSING_BATCH_SIZE < recipientsToSend.length) {
      console.log(`[Campaign] Waiting ${DELAY_BETWEEN_PROCESSING_BATCHES}ms before next processing batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PROCESSING_BATCHES));
    }
  }

  // Mark campaign as sent (retry logic handled automatically)
  try {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'sent',
        totalSent: totalSent,
        totalBounced: totalFailed
      }
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Campaign] ✅ Campaign ${campaignId} completed in ${duration}s: ${totalSent} sent, ${totalFailed} failed, ${totalSkipped} skipped (already received)`);
  } catch (updateError) {
    console.error(`[Campaign] Error marking campaign as sent:`, updateError);
  }
  
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[Campaign] ❌ Fatal error in sendCampaignEmails after ${duration}s:`, error);
    console.error(`[Campaign] Error stack:`, error.stack);
    
    // Update campaign status to error
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'error',
          errorMessage: error.message || 'Unknown error occurred during sending'
        }
      });
      console.log(`[Campaign] Campaign ${campaignId} marked as error`);
    } catch (updateError) {
      console.error(`[Campaign] Failed to update campaign status to error:`, updateError);
    }
    
    throw error; // Re-throw to be caught by caller
  }
}

