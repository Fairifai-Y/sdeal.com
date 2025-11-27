const prisma = require('../../lib/prisma-with-retry');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Helper function to format from email with display name
function formatFromEmail(email) {
  if (!email) return '';
  if (email.includes('<') && email.includes('>')) {
    return email;
  }
  return `SDeal – Exclusieve Deals <${email}>`;
}

// Helper function to replace template variables
function replaceTemplateVariables(content, consumer) {
  if (!content || !consumer) return content;
  
  return content
    .replace(/\{\{firstName\}\}/g, consumer.firstName || '')
    .replace(/\{\{lastName\}\}/g, consumer.lastName || '')
    .replace(/\{\{email\}\}/g, consumer.email || '')
    .replace(/\{\{store\}\}/g, consumer.store || '')
    .replace(/\{\{country\}\}/g, consumer.country || consumer.store || '');
}

// Helper function to wrap email content in template
function wrapEmailTemplate(htmlContent) {
  if (!htmlContent) return '';
  
  // Check if already wrapped
  if (htmlContent.includes('<html') || htmlContent.includes('<!DOCTYPE')) {
    return htmlContent;
  }
  
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
          <tr>
            <td style="padding: 20px; background-color: #ffffff; border-bottom: 1px solid #eeeeee;">
              <img src="https://www.sdeal.com/logo.png" alt="SDeal" style="max-width: 150px; height: auto;">
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              ${htmlContent}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px 0;">Met vriendelijke groet,<br><strong>Het SDeal Team</strong></p>
              <p style="margin: 10px 0;">© ${new Date().getFullYear()} SDeal. Alle rechten voorbehouden.</p>
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

/**
 * Process a single batch creation job (creates batches for one chunk)
 */
async function processBatchCreationJob(job) {
  const startTime = Date.now();
  console.log(`[Batch Job Worker] Processing job ${job.id} for campaign ${job.campaignId}`);
  console.log(`   Status: ${job.status}, Progress: ${job.processedCount}/${job.totalRecipients}, Batches created: ${job.batchesCreated}`);

  try {
    // Update job status to processing
    await prisma.batchCreationJob.update({
      where: { id: job.id },
      data: {
        status: 'processing',
        startedAt: job.startedAt || new Date()
      }
    });

    // Get recipient IDs from job
    const recipientIds = Array.isArray(job.recipientIds) ? job.recipientIds : [];
    
    if (recipientIds.length === 0) {
      throw new Error('No recipient IDs in job');
    }

    // Calculate current chunk
    const chunkStart = job.currentChunk * job.chunkSize;
    const chunkEnd = Math.min(chunkStart + job.chunkSize, recipientIds.length);
    const chunkRecipientIds = recipientIds.slice(chunkStart, chunkEnd);

    if (chunkRecipientIds.length === 0) {
      // No more recipients to process
      await prisma.batchCreationJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      // Update campaign status to queued (batches are ready)
      await prisma.emailCampaign.update({
        where: { id: job.campaignId },
        data: {
          status: 'queued',
          totalRecipients: job.totalRecipients
        }
      });

      console.log(`[Batch Job Worker] ✅ Job ${job.id} completed! Created ${job.batchesCreated} batches total.`);
      return { success: true, completed: true, batchesCreated: 0 };
    }

    console.log(`[Batch Job Worker] Processing chunk ${job.currentChunk + 1} (recipients ${chunkStart + 1}-${chunkEnd} of ${recipientIds.length})`);

    // Fetch consumers for this chunk
    const consumers = await prisma.consumer.findMany({
      where: {
        id: { in: chunkRecipientIds }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        store: true,
        country: true
      }
    });

    if (consumers.length === 0) {
      console.log(`[Batch Job Worker] ⚠️ No consumers found for chunk ${job.currentChunk + 1}`);
      // Move to next chunk
      await prisma.batchCreationJob.update({
        where: { id: job.id },
        data: {
          currentChunk: job.currentChunk + 1,
          processedCount: job.processedCount + chunkRecipientIds.length,
          status: 'pending', // Ready for next chunk
          nextProcessAt: new Date()
        }
      });
      return { success: true, completed: false, batchesCreated: 0 };
    }

    // Get template and campaign data
    const templateData = job.templateData || {};
    const campaignData = job.campaignData || {};

    // Process consumers in batches
    const BATCH_SIZE = job.batchSize || 100;
    let batchesCreatedThisChunk = 0;

    for (let i = 0; i < consumers.length; i += BATCH_SIZE) {
      const batchConsumers = consumers.slice(i, i + BATCH_SIZE);
      const emailMessages = [];

      // Prepare emails for this batch
      for (const consumer of batchConsumers) {
        try {
          // Replace template variables
          const subject = replaceTemplateVariables(campaignData.subject || templateData.subject || '', consumer);
          let htmlContent = replaceTemplateVariables(templateData.htmlContent || '', consumer);
          
          // Wrap content in email template
          htmlContent = wrapEmailTemplate(htmlContent);
          
          // Replace unsubscribe URL
          const unsubscribeUrl = `${process.env.BASE_URL || 'https://www.sdeal.com'}/unsubscribe?email=${encodeURIComponent(consumer.email)}&token=${consumer.id}`;
          htmlContent = htmlContent.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);

          const textContent = templateData.textContent 
            ? replaceTemplateVariables(templateData.textContent, consumer)
            : htmlContent.replace(/<[^>]*>/g, '');

          // Create email message
          emailMessages.push({
            to: consumer.email,
            from: formatFromEmail(process.env.FROM_EMAIL),
            subject: subject,
            html: htmlContent,
            text: textContent,
            consumerId: consumer.id,
            customArgs: {
              source: 'sdeal-mailing',
              campaignId: job.campaignId,
              consumerId: consumer.id
            }
          });
        } catch (error) {
          console.error(`[Batch Job Worker] Error preparing email for ${consumer.email}:`, error.message);
        }
      }

      if (emailMessages.length > 0) {
        try {
          // Create batch in database
          await prisma.emailBatch.create({
            data: {
              campaignId: job.campaignId,
              emails: emailMessages,
              status: 'pending',
              priority: 0
            }
          });
          
          batchesCreatedThisChunk++;
          console.log(`[Batch Job Worker] ✅ Created batch ${batchesCreatedThisChunk} in chunk ${job.currentChunk + 1} (${emailMessages.length} emails)`);
        } catch (batchError) {
          console.error(`[Batch Job Worker] ❌ Error creating batch:`, batchError.message);
        }
      }
    }

    // Update job progress
    const newProcessedCount = job.processedCount + chunkRecipientIds.length;
    const newBatchesCreated = job.batchesCreated + batchesCreatedThisChunk;
    const isCompleted = chunkEnd >= recipientIds.length;

    await prisma.batchCreationJob.update({
      where: { id: job.id },
      data: {
        processedCount: newProcessedCount,
        batchesCreated: newBatchesCreated,
        currentChunk: job.currentChunk + 1,
        status: isCompleted ? 'completed' : 'pending',
        completedAt: isCompleted ? new Date() : null,
        nextProcessAt: isCompleted ? null : new Date() // Process next chunk immediately
      }
    });

    if (isCompleted) {
      // Update campaign status to queued
      await prisma.emailCampaign.update({
        where: { id: job.campaignId },
        data: {
          status: 'queued',
          totalRecipients: job.totalRecipients
        }
      });

      console.log(`[Batch Job Worker] ✅ Job ${job.id} completed! Created ${newBatchesCreated} batches total.`);
    } else {
      console.log(`[Batch Job Worker] 📊 Progress: ${newProcessedCount}/${job.totalRecipients} recipients processed, ${newBatchesCreated} batches created`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return {
      success: true,
      completed: isCompleted,
      batchesCreated: batchesCreatedThisChunk,
      duration: parseFloat(duration)
    };

  } catch (error) {
    console.error(`[Batch Job Worker] ❌ Error processing job ${job.id}:`, error);
    
    // Update job status to failed
    await prisma.batchCreationJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        errorMessage: error.message
      }
    }).catch(updateError => {
      console.error(`[Batch Job Worker] Error updating job status:`, updateError);
    });

    // Update campaign status to error
    await prisma.emailCampaign.update({
      where: { id: job.campaignId },
      data: {
        status: 'error',
        errorMessage: `Batch creation failed: ${error.message}`
      }
    }).catch(updateError => {
      console.error(`[Batch Job Worker] Error updating campaign status:`, updateError);
    });

    throw error;
  }
}

/**
 * Main worker function - processes pending batch creation jobs
 */
async function processPendingBatchJobs(maxJobs = 1) {
  const workerStartTime = Date.now();
  console.log(`[Batch Job Worker] 🚀 Starting batch creation job processing (max ${maxJobs} job(s))`);

  try {
    // Get pending jobs (ordered by creation date)
    const jobs = await prisma.batchCreationJob.findMany({
      where: {
        status: { in: ['pending', 'processing'] },
        OR: [
          { nextProcessAt: null },
          { nextProcessAt: { lte: new Date() } }
        ]
      },
      orderBy: [
        { createdAt: 'asc' } // Process oldest first
      ],
      take: maxJobs,
      include: {
        campaign: {
          select: {
            id: true,
            status: true,
            name: true
          }
        }
      }
    });

    if (jobs.length === 0) {
      console.log(`[Batch Job Worker] No pending batch creation jobs to process`);
      return { processed: 0, batchesCreated: 0 };
    }

    console.log(`[Batch Job Worker] Found ${jobs.length} job(s) to process`);

    let totalBatchesCreated = 0;
    let processed = 0;

    // Process jobs sequentially
    for (const job of jobs) {
      // Check if campaign is still valid
      if (job.campaign.status === 'cancelled' || job.campaign.status === 'error') {
        console.log(`[Batch Job Worker] Skipping job ${job.id} - campaign ${job.campaignId} is ${job.campaign.status}`);
        await prisma.batchCreationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMessage: `Campaign is ${job.campaign.status}`
          }
        });
        continue;
      }

      try {
        const result = await processBatchCreationJob(job);
        processed++;
        totalBatchesCreated += result.batchesCreated || 0;

        // If job is not completed, it will be processed in next cron run
        if (!result.completed) {
          console.log(`[Batch Job Worker] Job ${job.id} partially processed. Will continue in next run.`);
        }

        // Small delay between jobs
        if (processed < jobs.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`[Batch Job Worker] Error processing job ${job.id}:`, error);
        // Continue with next job
      }
    }

    const duration = ((Date.now() - workerStartTime) / 1000).toFixed(2);
    console.log(`[Batch Job Worker] ✅ Processed ${processed} job(s), created ${totalBatchesCreated} batches in ${duration}s`);

    return {
      processed,
      batchesCreated: totalBatchesCreated
    };

  } catch (error) {
    console.error('[Batch Job Worker] Fatal error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get job status
    if (req.method === 'GET') {
      const { campaignId } = req.query;
      
      if (campaignId) {
        const job = await prisma.batchCreationJob.findFirst({
          where: { campaignId },
          orderBy: { createdAt: 'desc' }
        });

        return res.json({
          success: true,
          data: job
        });
      }

      // Get all pending/processing jobs
      const jobs = await prisma.batchCreationJob.findMany({
        where: {
          status: { in: ['pending', 'processing'] }
        },
        orderBy: { createdAt: 'asc' },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: jobs
      });
    }

    // POST - Process batch creation jobs (called by cronjob)
    if (req.method === 'POST') {
      const { maxJobs = 1 } = req.body;

      // Process jobs in background
      processPendingBatchJobs(maxJobs)
        .then(result => {
          console.log('[Batch Job Worker] Background processing completed:', result);
        })
        .catch(error => {
          console.error('[Batch Job Worker] Background processing error:', error);
        });

      return res.json({
        success: true,
        message: 'Batch creation job processing started',
        data: {
          status: 'started'
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('[Batch Job Worker API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

