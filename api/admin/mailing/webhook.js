const prisma = require('../../lib/prisma-with-retry');

module.exports = async (req, res) => {
  // SendGrid webhook endpoint
  // SendGrid sends POST requests with an array of events
  
  if (req.method === 'POST') {
    try {
      const events = Array.isArray(req.body) ? req.body : [req.body];
      
      console.log(`[Email Webhook] Received ${events.length} event(s)`);

      for (const event of events) {
        try {
          const {
            event: eventType, // 'open', 'click', 'delivered', 'bounce', etc.
            email,
            timestamp,
            sg_event_id,
            sg_message_id,
            useragent,
            ip,
            url, // For click events
            reason, // For bounce events
            status, // For bounce events
            category,
            custom_args, // SendGrid format (with underscore)
            customArgs // Alternative format (camelCase)
          } = event;

          // Extract custom args - SendGrid can send them in different formats
          let customArgsObj = custom_args || customArgs || {};
          
          // Handle array format: [{ key: 'source', value: '...' }]
          if (Array.isArray(customArgsObj)) {
            const converted = {};
            customArgsObj.forEach(item => {
              if (item && item.key && item.value !== undefined) {
                converted[item.key] = item.value;
              }
            });
            customArgsObj = converted;
          }
          
          // Handle string format (JSON)
          if (typeof customArgsObj === 'string') {
            try {
              customArgsObj = JSON.parse(customArgsObj);
            } catch (e) {
              customArgsObj = {};
            }
          }
          
          // Check if this event is from our mailing system
          const source = customArgsObj?.source || customArgsObj?.source_id;
          if (source !== 'sdeal-mailing') {
            // Skip events from other sources (e.g., Magento)
            continue;
          }
          
          // Extract campaign and consumer IDs
          let campaignId = customArgsObj?.campaignId || customArgsObj?.campaign_id;
          let consumerId = customArgsObj?.consumerId || customArgsObj?.consumer_id;

          // Skip if missing required IDs
          if (!campaignId || !consumerId) {
            continue;
          }

          // Map SendGrid event types to our event types
          let mappedEventType = null;
          switch (eventType) {
            case 'open':
              mappedEventType = 'opened';
              break;
            case 'click':
              mappedEventType = 'clicked';
              break;
            case 'delivered':
              mappedEventType = 'delivered';
              break;
            case 'bounce':
              mappedEventType = 'bounced';
              break;
            case 'unsubscribe':
              mappedEventType = 'unsubscribed';
              break;
            case 'spamreport':
              mappedEventType = 'complained';
              break;
            default:
              continue; // Skip unknown event types
          }

          // Check if event already exists (prevent duplicates)
          // For click events, we'll check URL in eventData after fetching
          const existingEvents = await prisma.emailEvent.findMany({
            where: {
              campaignId,
              consumerId,
              eventType: mappedEventType
            },
            orderBy: {
              occurredAt: 'desc'
            },
            take: 1
          });

          let existingEvent = existingEvents[0] || null;
          
          // For click events, check if URL matches
          if (mappedEventType === 'clicked' && url && existingEvent && existingEvent.eventData) {
            const eventData = existingEvent.eventData;
            if (eventData.url === url) {
              existingEvent = existingEvent; // Keep it
            } else {
              existingEvent = null; // Different URL, allow it
            }
          }

          // Skip if this exact event was already recorded recently (within 1 minute)
          if (existingEvent) {
            const timeDiff = Math.abs(new Date(timestamp * 1000).getTime() - existingEvent.occurredAt.getTime());
            if (timeDiff < 60000) {
              continue; // Skip duplicate
            }
          }

          // Prepare event data
          const eventData = {};
          if (url) eventData.url = url;
          if (reason) eventData.reason = reason;
          if (status) eventData.status = status;
          if (category && category.length > 0) eventData.categories = category;

          // Determine bounce type for bounce events
          let bounceType = null;
          if (mappedEventType === 'bounced') {
            // Hard bounce: permanent failure (5xx errors, invalid email, etc.)
            // Soft bounce: temporary failure (mailbox full, etc.)
            bounceType = (status && status.startsWith('5')) || 
                        (reason && reason.toLowerCase().includes('invalid')) ||
                        (reason && reason.toLowerCase().includes('permanent')) 
                        ? 'hard' : 'soft';
          }

          // Create email event
          const emailEvent = await prisma.emailEvent.create({
            data: {
              campaignId,
              consumerId,
              eventType: mappedEventType,
              bounceType,
              bounceReason: reason || null,
              eventData: Object.keys(eventData).length > 0 ? eventData : null,
              userAgent: useragent || null,
              ipAddress: ip || null,
              occurredAt: new Date(timestamp * 1000) // SendGrid timestamp is in seconds
            }
          });

          // Update campaign statistics
          const updateData = {};
          switch (mappedEventType) {
            case 'delivered':
              updateData.totalDelivered = { increment: 1 };
              break;
            case 'opened':
              updateData.totalOpened = { increment: 1 };
              break;
            case 'clicked':
              updateData.totalClicked = { increment: 1 };
              break;
            case 'bounced':
              updateData.totalBounced = { increment: 1 };
              break;
            case 'unsubscribed':
              updateData.totalUnsubscribed = { increment: 1 };
              break;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.emailCampaign.update({
              where: { id: campaignId },
              data: updateData
            });
          }

          // Update consumer statistics and last contact dates
          const consumerUpdateData = {};
          switch (mappedEventType) {
            case 'opened':
              consumerUpdateData.lastEmailOpenedAt = new Date(timestamp * 1000);
              consumerUpdateData.totalEmailsOpened = { increment: 1 };
              break;
            case 'clicked':
              consumerUpdateData.lastEmailClickedAt = new Date(timestamp * 1000);
              consumerUpdateData.totalEmailsClicked = { increment: 1 };
              break;
            case 'delivered':
              consumerUpdateData.lastContactAt = new Date(timestamp * 1000);
              consumerUpdateData.totalEmailsSent = { increment: 1 };
              break;
            case 'unsubscribed':
              consumerUpdateData.isUnsubscribed = true;
              consumerUpdateData.unsubscribedAt = new Date(timestamp * 1000);
              break;
          }

          if (Object.keys(consumerUpdateData).length > 0) {
            await prisma.consumer.update({
              where: { id: consumerId },
              data: consumerUpdateData
            });
          }

          // Event recorded successfully

        } catch (eventError) {
          console.error(`[Email Webhook] Error processing event:`, eventError);
          // Continue processing other events even if one fails
        }
      }

      // Always return 200 to SendGrid
      return res.status(200).json({ success: true, processed: events.length });

    } catch (error) {
      console.error('[Email Webhook] Error:', error);
      // Still return 200 to SendGrid to prevent retries
      return res.status(200).json({ success: false, error: error.message });
    }
  }

  // GET - Webhook verification or status
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'SendGrid webhook endpoint is active',
      endpoint: '/api/admin/mailing/webhook'
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};

