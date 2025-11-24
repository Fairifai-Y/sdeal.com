const prisma = require('../../lib/prisma');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('[Campaign] SendGrid initialized');
} else {
  console.warn('[Campaign] SENDGRID_API_KEY not found in environment variables');
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
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #333333;">SDeal</h1>
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
                Deze email is verzonden naar {{email}}. 
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
          // Get consumers from list
          const listMembers = await prisma.emailListMember.findMany({
            where: {
              listId: filterCriteria.listId,
              status: 'subscribed'
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
async function sendCampaignEmails(campaignId, campaign, recipients) {
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

  // Send emails in batches to avoid overwhelming SendGrid and Vercel timeout
  const BATCH_SIZE = 10; // Send 10 emails at a time
  const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (consumer) => {
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

        // Create email message
        const msg = {
          to: consumer.email,
          from: process.env.FROM_EMAIL,
          subject: subject,
          html: htmlContent,
          text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML if no text version
          // Add custom args for tracking
          customArgs: {
            campaignId: campaignId,
            consumerId: consumer.id
          }
        };

        // Send email via SendGrid
        await sgMail.send(msg);

        // Record email event
        await prisma.emailEvent.create({
          data: {
            campaignId: campaignId,
            consumerId: consumer.id,
            eventType: 'sent',
            occurredAt: new Date()
          }
        });

        totalSent++;
        console.log(`[Campaign] Email sent to ${consumer.email} (${totalSent}/${recipients.length})`);

      } catch (error) {
        totalFailed++;
        console.error(`[Campaign] Failed to send email to ${consumer.email}:`, error.message);

        // Record bounce event if it's a bounce error
        try {
          await prisma.emailEvent.create({
            data: {
              campaignId: campaignId,
              consumerId: consumer.id,
              eventType: 'bounced',
              bounceType: 'hard',
              bounceReason: error.message,
              occurredAt: new Date()
            }
          });
        } catch (eventError) {
          console.error(`[Campaign] Error creating bounce event:`, eventError);
        }
      }
    });

    // Wait for batch to complete
    await Promise.all(batchPromises);

    // Update campaign progress
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          totalSent: totalSent,
          totalBounced: totalFailed
        }
      });
    } catch (updateError) {
      console.error(`[Campaign] Error updating campaign progress:`, updateError);
    }

    // Delay between batches (except for the last batch)
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  // Mark campaign as sent
  try {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'sent',
        totalSent: totalSent,
        totalBounced: totalFailed
      }
    });
    console.log(`[Campaign] Campaign ${campaignId} completed: ${totalSent} sent, ${totalFailed} failed`);
  } catch (updateError) {
    console.error(`[Campaign] Error marking campaign as sent:`, updateError);
  }
}

