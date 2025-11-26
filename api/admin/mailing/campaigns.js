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

// Export maxDuration for Vercel (300 seconds = 5 minutes)
module.exports.maxDuration = 300;

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

        // Check for existing batches first (before transaction)
        const existingBatchesCheck = await prisma.emailBatch.findMany({
          where: {
            campaignId: id,
            status: { in: ['pending', 'processing'] }
          },
          take: 1
        });

        if (existingBatchesCheck.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Campaign already has active batches. Please wait for them to be processed.'
          });
        }

        // Allow resending if campaign is 'sent' or if status is 'queued'/'sending' but no batches exist
        // This handles cases where a previous attempt failed or was interrupted
        if (campaign.status === 'sent') {
          console.log(`[Campaign] Resending campaign ${id} - will skip consumers who already received this template`);
        } else if (campaign.status === 'queued' || campaign.status === 'sending') {
          console.log(`[Campaign] Campaign ${id} has status ${campaign.status} but no pending batches - allowing resend`);
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

        // CRITICAL: Use a transaction to atomically check and update status
        // This prevents race conditions where multiple requests try to create batches simultaneously
        let updatedCampaign;
        try {
          updatedCampaign = await prisma.$transaction(async (tx) => {
            // Re-check campaign status within transaction to prevent race conditions
            const currentCampaign = await tx.emailCampaign.findUnique({
              where: { id },
              select: { status: true }
            });

            if (!currentCampaign) {
              throw new Error('Campaign not found');
            }

            // Double-check for active batches within transaction (race condition protection)
            const existingBatches = await tx.emailBatch.count({
              where: {
                campaignId: id,
                status: { in: ['pending', 'processing'] }
              }
            });

            if (existingBatches > 0) {
              throw new Error('Campaign already has active batches. Please wait for them to be processed.');
            }

            // Allow updating to 'queued' from any status if no batches exist
            // This handles cases where status is 'queued'/'sending' but no batches were created (failed attempt)
            // Atomically update status to 'queued' - this acts as a lock
            return await tx.emailCampaign.update({
              where: { id },
              data: {
                status: 'queued',
                totalRecipients: recipients.length
              }
            });
          });
        } catch (transactionError) {
          // If transaction fails (e.g., due to race condition), return error
          console.error(`[Campaign] ❌ Transaction failed for campaign ${id}:`, transactionError.message);
          return res.status(400).json({
            success: false,
            error: transactionError.message || 'Failed to queue campaign. It may already be queued or sending.'
          });
        }

        // Create email batches instead of sending directly
        console.log(`[Campaign] Creating email batches for campaign ${id} with ${recipients.length} recipients`);

        // Create batches in background (don't wait for completion)
        // Note: This runs asynchronously to avoid Vercel timeout
        createEmailBatches(id, campaign, recipients)
          .then(result => {
            console.log(`[Campaign] ✅ Successfully created all batches for campaign ${id}: ${result.totalBatches} batches`);
          })
          .catch(error => {
            console.error(`[Campaign] ❌ Error creating email batches:`, error);
            console.error(`[Campaign] Error stack:`, error.stack);
            // Update campaign status to error
            prisma.emailCampaign.update({
              where: { id },
              data: {
                status: 'error',
                errorMessage: error.message || 'Failed to create email batches'
              }
            }).catch(updateError => {
              console.error(`[Campaign] Error updating campaign status:`, updateError);
            });
          });

        return res.json({
          success: true,
          message: `Campaign queued for ${recipients.length} recipients. Batches will be processed by cron job.`,
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

// Function to create email batches for queue-based sending
// This prevents Vercel timeouts by splitting emails into batches that are processed by a cron job
async function createEmailBatches(campaignId, campaign, recipients) {
  const startTime = Date.now();
  console.log(`[Campaign] 🚀 Creating email batches for campaign ${campaignId} with ${recipients.length} recipients`);
  
  try {
    // Double-check: prevent duplicate batch creation
    // Check if there are already pending/processing batches for this campaign
    const existingBatches = await prisma.emailBatch.findMany({
      where: {
        campaignId: campaignId,
        status: { in: ['pending', 'processing'] }
      },
      take: 1
    });

    if (existingBatches.length > 0) {
      console.log(`[Campaign] ⚠️ Campaign ${campaignId} already has pending/processing batches. Skipping batch creation to prevent duplicates.`);
      return {
        success: false,
        error: 'Batches already exist for this campaign',
        totalBatches: 0,
        totalRecipients: 0,
        duration: 0
      };
    }

    if (!campaign.template) {
      throw new Error('Campaign template not found');
    }

    const template = campaign.template;
    const templateId = campaign.templateId;
    const BATCH_SIZE = 100; // Emails per batch (SendGrid supports up to 1000, but 100 is safer)
    
    // Check which recipients have already received this template (not just this campaign)
    // This prevents sending the same template to a consumer multiple times across different campaigns
    console.log(`[Campaign] Checking for duplicate sends (template-based)...`);
    
    let alreadySentSet = new Set();
    
    if (templateId) {
      // Find all campaigns that used this template
      const campaignsWithSameTemplate = await prisma.emailCampaign.findMany({
        where: {
          templateId: templateId,
          status: { in: ['sent', 'sending', 'queued'] } // Only check sent/sending campaigns
        },
        select: {
          id: true
        }
      });
      
      const campaignIds = campaignsWithSameTemplate.map(c => c.id);
      
      if (campaignIds.length > 0) {
        // Find all consumers who already received this template (from any campaign)
        const existingEvents = await prisma.emailEvent.findMany({
          where: {
            campaignId: { in: campaignIds },
            eventType: 'sent'
          },
          select: {
            consumerId: true
          }
        });
        
        alreadySentSet = new Set(existingEvents.map(e => e.consumerId));
        console.log(`[Campaign] Found ${alreadySentSet.size} recipients who already received this template (from ${campaignIds.length} previous campaign(s))`);
      } else {
        console.log(`[Campaign] No previous campaigns found with this template`);
      }
    } else {
      // Fallback: check only this campaign if no templateId
      console.log(`[Campaign] No templateId found, checking only this campaign...`);
      const existingEvents = await prisma.emailEvent.findMany({
        where: {
          campaignId: campaignId,
          eventType: 'sent'
        },
        select: {
          consumerId: true
        }
      });
      
      alreadySentSet = new Set(existingEvents.map(e => e.consumerId));
      console.log(`[Campaign] Found ${alreadySentSet.size} recipients who already received this campaign`);
    }

    // Filter out recipients who already received this template
    const recipientsToSend = recipients.filter(consumer => !alreadySentSet.has(consumer.id));
    const totalSkipped = recipients.length - recipientsToSend.length;
    
    console.log(`[Campaign] Will create batches for ${recipientsToSend.length} recipients (${totalSkipped} skipped - already received this template)`);

    // Prepare all emails and create batches
    // Create batches incrementally to avoid timeout
    let batchNumber = 0;
    let totalBatches = 0;
    const expectedBatches = Math.ceil(recipientsToSend.length / BATCH_SIZE);
    
    console.log(`[Campaign] Will create approximately ${expectedBatches} batches (${recipientsToSend.length} recipients / ${BATCH_SIZE} per batch)`);
    
    // Process in smaller chunks to avoid timeout
    // Increased from 200 to 500 to reduce database calls and improve throughput
    const CHUNK_SIZE = 500; // Process 500 recipients at a time before saving batches
    
    for (let chunkStart = 0; chunkStart < recipientsToSend.length; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, recipientsToSend.length);
      const chunkRecipients = recipientsToSend.slice(chunkStart, chunkEnd);
      
      console.log(`[Campaign] Processing chunk ${Math.floor(chunkStart / CHUNK_SIZE) + 1}/${Math.ceil(recipientsToSend.length / CHUNK_SIZE)} (recipients ${chunkStart + 1}-${chunkEnd} of ${recipientsToSend.length})`);
      
      // Process this chunk in batches
      for (let i = 0; i < chunkRecipients.length; i += BATCH_SIZE) {
        const batchRecipients = chunkRecipients.slice(i, i + BATCH_SIZE);
        const emailMessages = [];
        
        // Prepare emails for this batch
        for (const consumer of batchRecipients) {
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

            // Create email message for batch
            emailMessages.push({
              to: consumer.email,
              from: formatFromEmail(process.env.FROM_EMAIL),
              subject: subject,
              html: htmlContent,
              text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
              consumerId: consumer.id, // Store consumerId for tracking
              customArgs: {
                campaignId: campaignId,
                consumerId: consumer.id
              }
            });
          } catch (error) {
            console.error(`[Campaign] Error preparing email for ${consumer.email}:`, error.message);
          }
        }

        if (emailMessages.length > 0) {
          try {
            // Create batch in database immediately
            await prisma.emailBatch.create({
              data: {
                campaignId: campaignId,
                emails: emailMessages,
                status: 'pending',
                priority: 0
              }
            });
            
            batchNumber++;
            totalBatches++;
            console.log(`[Campaign] ✅ Created batch ${batchNumber}/${expectedBatches} with ${emailMessages.length} emails`);
          } catch (batchError) {
            console.error(`[Campaign] ❌ Error creating batch ${batchNumber + 1}:`, batchError.message);
            console.error(`[Campaign] Batch error stack:`, batchError.stack);
            // Continue with next batch even if one fails
          }
        } else {
          console.log(`[Campaign] ⚠️ Skipping empty batch ${batchNumber + 1}`);
        }
      }
      
      // Small delay between chunks to prevent overwhelming the database
      // Reduced delay since we're processing in larger chunks now
      if (chunkEnd < recipientsToSend.length) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay (reduced from 100ms)
      }
    }

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'queued',
        totalRecipients: recipientsToSend.length
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Campaign] ✅ Created ${totalBatches} batches for campaign ${campaignId} in ${duration}s. Batches will be processed by cron job.`);
    
    // Return result for logging
    return {
      success: true,
      totalBatches: totalBatches,
      totalRecipients: recipientsToSend.length,
      duration: duration
    };
  
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

