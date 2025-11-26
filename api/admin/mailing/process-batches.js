const prisma = require('../../lib/prisma-with-retry');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('[Batch Worker] SENDGRID_API_KEY not found in environment variables');
}

// Helper function to format from email with display name
function formatFromEmail(email) {
  if (!email) return email;
  if (email.includes('<') && email.includes('>')) {
    return email;
  }
  return `SDeal – Exclusieve Deals <${email}>`;
}

/**
 * Process a single email batch
 */
async function processBatch(batch) {
  const startTime = Date.now();
  console.log(`[Batch Worker] Processing batch ${batch.id} for campaign ${batch.campaignId} (${Array.isArray(batch.emails) ? batch.emails.length : 'unknown'} emails)`);
  
  try {
    // Update batch status to processing
    await prisma.emailBatch.update({
      where: { id: batch.id },
      data: {
        status: 'processing',
        processedAt: new Date()
      }
    });

    const emails = Array.isArray(batch.emails) ? batch.emails : [];
    if (emails.length === 0) {
      throw new Error('Batch has no emails');
    }

    // Send batch via SendGrid
    const sendGridResponse = await sgMail.send(emails);
    if (sendGridResponse && sendGridResponse[0]) {
      console.log(`[Batch Worker] SendGrid response: ${sendGridResponse[0].statusCode} ${sendGridResponse[0].statusMessage || ''}`);
    }

    // Create email events and update consumers
    const emailEvents = [];
    const consumerIds = [];
    
    for (const email of emails) {
      if (email.consumerId) {
        emailEvents.push({
          campaignId: batch.campaignId,
          consumerId: email.consumerId,
          eventType: 'sent',
          occurredAt: new Date()
        });
        consumerIds.push(email.consumerId);
      }
    }

    // Bulk create email events
    if (emailEvents.length > 0) {
      await prisma.emailEvent.createMany({
        data: emailEvents,
        skipDuplicates: true
      });
    }

    // Bulk update consumers (update lastContactAt)
    if (consumerIds.length > 0) {
      await prisma.consumer.updateMany({
        where: {
          id: { in: consumerIds }
        },
        data: {
          lastContactAt: new Date()
        }
      });
    }

    // Update batch status
    await prisma.emailBatch.update({
      where: { id: batch.id },
      data: {
        status: 'sent',
        sentCount: emails.length,
        processedAt: new Date()
      }
    });

    // Update campaign statistics
    await prisma.emailCampaign.update({
      where: { id: batch.campaignId },
      data: {
        totalSent: { increment: emails.length }
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Batch Worker] ✅ Batch ${batch.id} completed in ${duration}s: ${emails.length} emails sent`);

    return { success: true, sent: emails.length, failed: 0 };

  } catch (error) {
    console.error(`[Batch Worker] ❌ Error processing batch ${batch.id}:`, error.message);
    console.error(`[Batch Worker] Error stack:`, error.stack);

    // Update batch with error
    const retryCount = batch.retryCount + 1;
    const shouldRetry = retryCount < batch.maxRetries;
    
    await prisma.emailBatch.update({
      where: { id: batch.id },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        errorMessage: error.message,
        retryCount: retryCount,
        nextRetryAt: shouldRetry ? new Date(Date.now() + Math.pow(2, retryCount) * 60000) : null // Exponential backoff: 2min, 4min, 8min
      }
    });

    return { success: false, sent: 0, failed: Array.isArray(batch.emails) ? batch.emails.length : 0, error: error.message };
  }
}

/**
 * Main worker function - processes pending batches
 */
async function processPendingBatches(maxBatches = 5) {
  const workerStartTime = Date.now();
  console.log(`[Batch Worker] 🚀 Starting batch processing (max ${maxBatches} batches)`);
  
  try {
    // Get pending batches (ordered by priority and creation date)
    // Also get batches that should be retried (nextRetryAt is in the past)
    const now = new Date();
    const batches = await prisma.emailBatch.findMany({
      where: {
        OR: [
          { status: 'pending' },
          {
            status: 'pending',
            nextRetryAt: { lte: now }
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: maxBatches,
      include: {
        campaign: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (batches.length === 0) {
      console.log(`[Batch Worker] No pending batches to process`);
      return { processed: 0, sent: 0, failed: 0 };
    }

    console.log(`[Batch Worker] Found ${batches.length} batch(es) to process`);

    let totalSent = 0;
    let totalFailed = 0;
    let processed = 0;

    // Process batches sequentially to avoid overwhelming SendGrid
    for (const batch of batches) {
      // Check if campaign is still active
      if (batch.campaign.status === 'cancelled' || batch.campaign.status === 'error') {
        console.log(`[Batch Worker] Skipping batch ${batch.id} - campaign ${batch.campaignId} is ${batch.campaign.status}`);
        await prisma.emailBatch.update({
          where: { id: batch.id },
          data: { status: 'failed', errorMessage: `Campaign is ${batch.campaign.status}` }
        });
        continue;
      }

      // Update campaign status to 'sending' if it's still 'queued'
      if (batch.campaign.status === 'queued') {
        await prisma.emailCampaign.update({
          where: { id: batch.campaignId },
          data: { status: 'sending', sentAt: new Date() }
        });
      }

      const result = await processBatch(batch);
      processed++;
      totalSent += result.sent;
      totalFailed += result.failed;

      // Small delay between batches to avoid rate limiting
      if (processed < batches.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    // Check if all batches for campaigns are done
    const campaignsWithBatches = await prisma.emailCampaign.findMany({
      where: {
        id: { in: [...new Set(batches.map(b => b.campaignId))] },
        status: 'sending'
      },
      include: {
        emailBatches: {
          select: {
            status: true
          }
        }
      }
    });

    for (const campaign of campaignsWithBatches) {
      const allBatchesSent = campaign.emailBatches.every(b => b.status === 'sent' || b.status === 'failed');
      if (allBatchesSent) {
        const sentBatches = campaign.emailBatches.filter(b => b.status === 'sent');
        const totalSentFromBatches = await prisma.emailBatch.aggregate({
          where: {
            campaignId: campaign.id,
            status: 'sent'
          },
          _sum: {
            sentCount: true
          }
        });

        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'sent',
            totalSent: totalSentFromBatches._sum.sentCount || 0,
            sentAt: new Date()
          }
        });

        console.log(`[Batch Worker] ✅ Campaign ${campaign.id} completed - all batches sent`);
      }
    }

    const duration = ((Date.now() - workerStartTime) / 1000).toFixed(2);
    console.log(`[Batch Worker] ✅ Processed ${processed} batch(es) in ${duration}s: ${totalSent} sent, ${totalFailed} failed`);

    return { processed, sent: totalSent, failed: totalFailed };

  } catch (error) {
    console.error(`[Batch Worker] ❌ Fatal error:`, error);
    throw error;
  }
}

module.exports = async (req, res) => {
  // Allow both GET (for cron) and POST (for manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Optional: Add authentication for manual triggers
  if (req.method === 'POST') {
    // You can add authentication here if needed
    // For now, we'll allow manual triggers
  }

  try {
    const maxBatches = parseInt(req.query.maxBatches || req.body?.maxBatches || '5');
    
    const result = await processPendingBatches(maxBatches);

    return res.json({
      success: true,
      message: `Processed ${result.processed} batch(es)`,
      data: result
    });

  } catch (error) {
    console.error('[Batch Worker] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

