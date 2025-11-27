const prisma = require('../../lib/prisma-with-retry');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Execute workflows for a newly created consumer
 */
async function executeWorkflowsForConsumer(consumerId) {
  try {
    const consumer = await prisma.consumer.findUnique({
      where: { id: consumerId }
    });

    if (!consumer || consumer.isUnsubscribed) {
      return; // Skip if consumer doesn't exist or is unsubscribed
    }

    // Find active workflows with consumer_created trigger
    const workflows = await prisma.emailWorkflow.findMany({
      where: {
        triggerType: 'consumer_created',
        isActive: true
      },
      include: {
        steps: {
          where: {
            isActive: true
          },
          include: {
            template: true
          },
          orderBy: {
            stepOrder: 'asc'
          }
        }
      }
    });

    for (const workflow of workflows) {
      // Check if workflow execution already exists (prevent duplicates)
      const existingExecution = await prisma.emailWorkflowExecution.findUnique({
        where: {
          workflowId_consumerId: {
            workflowId: workflow.id,
            consumerId: consumer.id
          }
        }
      });

      if (existingExecution) {
        continue; // Already executing this workflow for this consumer
      }

      // Create workflow execution
      const execution = await prisma.emailWorkflowExecution.create({
        data: {
          workflowId: workflow.id,
          consumerId: consumer.id,
          status: 'active',
          currentStep: 1,
          nextStepAt: new Date() // Execute first step immediately
        }
      });

      // Execute first step immediately (no delay)
      await executeWorkflowStep(workflow, workflow.steps[0], consumer, execution);
    }
  } catch (error) {
    console.error(`[Workflow Execution] Error executing workflows for consumer ${consumerId}:`, error);
  }
}

/**
 * Execute a single workflow step
 */
async function executeWorkflowStep(workflow, step, consumer, execution) {
  try {
    if (step.actionType === 'send_email') {
      if (!step.templateId || !step.template) {
        console.error(`[Workflow Execution] Step ${step.stepOrder} missing template`);
        return;
      }

      let template = step.template;

      // Try to find a country-specific template if the template name contains country codes
      // Template names like "Levenslange Korting NL" or "Levenslange Korting - BE" will be matched
      const consumerCountry = consumer.country || consumer.store || 'NL';
      const countryCodes = ['NL', 'BE', 'DE', 'FR'];
      
      // Check if template name contains a country code
      const templateNameHasCountry = countryCodes.some(code => 
        template.name.toUpperCase().includes(` ${code}`) || 
        template.name.toUpperCase().includes(`-${code}`) ||
        template.name.toUpperCase().endsWith(code)
      );

      // If template doesn't match consumer's country, try to find a matching template
      if (!templateNameHasCountry || !template.name.toUpperCase().includes(consumerCountry)) {
        // Try to find a template with the consumer's country in the name
        const countrySpecificTemplate = await prisma.emailTemplate.findFirst({
          where: {
            isActive: true,
            name: {
              contains: consumerCountry,
              mode: 'insensitive'
            }
          }
        });

        if (countrySpecificTemplate) {
          template = countrySpecificTemplate;
          console.log(`[Workflow Execution] Using country-specific template "${template.name}" for ${consumerCountry} consumer`);
        } else {
          // If no country-specific template found, use the original template
          console.log(`[Workflow Execution] No country-specific template found for ${consumerCountry}, using original template "${template.name}"`);
        }
      }

      // Replace template variables
      const subject = replaceTemplateVariables(template.subject || '', consumer);
      let htmlContent = replaceTemplateVariables(template.htmlContent || '', consumer);
      
      // Wrap content in email template if needed
      htmlContent = wrapEmailTemplate(htmlContent);
      
      // Replace unsubscribe URL
      const unsubscribeUrl = `${process.env.BASE_URL || 'https://www.sdeal.com'}/unsubscribe?email=${encodeURIComponent(consumer.email)}&token=${consumer.id}`;
      htmlContent = htmlContent.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);

      const textContent = template.textContent 
        ? replaceTemplateVariables(template.textContent, consumer)
        : htmlContent.replace(/<[^>]*>/g, '');

      // Send email via SendGrid
      const msg = {
        to: consumer.email,
        from: formatFromEmail(process.env.FROM_EMAIL),
        subject: subject,
        html: htmlContent,
        text: textContent,
        customArgs: {
          source: 'sdeal-mailing',
          workflowId: workflow.id,
          consumerId: consumer.id
        }
      };

      await sgMail.send(msg);

      // Create email event
      await prisma.emailEvent.create({
        data: {
          consumerId: consumer.id,
          eventType: 'sent',
          occurredAt: new Date(),
          userAgent: 'workflow',
          eventData: {
            workflowId: workflow.id,
            workflowName: workflow.name,
            stepOrder: step.stepOrder
          }
        }
      });

      // Update consumer
      await prisma.consumer.update({
        where: { id: consumer.id },
        data: {
          lastContactAt: new Date(),
          totalEmailsSent: { increment: 1 }
        }
      });

      console.log(`[Workflow Execution] Sent email to ${consumer.email} via workflow ${workflow.name}, step ${step.stepOrder}`);

    } else if (step.actionType === 'add_to_list') {
      const listId = step.actionConfig?.listId;
      if (!listId) {
        console.error(`[Workflow Execution] Step ${step.stepOrder} missing listId`);
        return;
      }

      // Add consumer to list
      await prisma.emailListMember.upsert({
        where: {
          listId_consumerId: {
            listId: listId,
            consumerId: consumer.id
          }
        },
        create: {
          listId: listId,
          consumerId: consumer.id,
          status: 'subscribed',
          source: 'workflow',
          sourceWorkflowId: workflow.id
        },
        update: {
          status: 'subscribed',
          source: 'workflow',
          sourceWorkflowId: workflow.id
        }
      });

      // Update list count
      const subscribedCount = await prisma.emailListMember.count({
        where: {
          listId: listId,
          status: 'subscribed'
        }
      });

      await prisma.emailList.update({
        where: { id: listId },
        data: { totalConsumers: subscribedCount }
      });

      console.log(`[Workflow Execution] Added ${consumer.email} to list via workflow ${workflow.name}, step ${step.stepOrder}`);

    } else if (step.actionType === 'remove_from_list') {
      const listId = step.actionConfig?.listId;
      if (!listId) {
        console.error(`[Workflow Execution] Step ${step.stepOrder} missing listId`);
        return;
      }

      // Remove consumer from list
      await prisma.emailListMember.deleteMany({
        where: {
          listId: listId,
          consumerId: consumer.id
        }
      });

      // Update list count
      const subscribedCount = await prisma.emailListMember.count({
        where: {
          listId: listId,
          status: 'subscribed'
        }
      });

      await prisma.emailList.update({
        where: { id: listId },
        data: { totalConsumers: subscribedCount }
      });

      console.log(`[Workflow Execution] Removed ${consumer.email} from list via workflow ${workflow.name}, step ${step.stepOrder}`);

    } else if (step.actionType === 'update_field') {
      const fieldName = step.actionConfig?.fieldName;
      const fieldValue = step.actionConfig?.fieldValue;
      
      if (!fieldName) {
        console.error(`[Workflow Execution] Step ${step.stepOrder} missing fieldName`);
        return;
      }

      // Update consumer field
      await prisma.consumer.update({
        where: { id: consumer.id },
        data: {
          [fieldName]: fieldValue
        }
      });

      console.log(`[Workflow Execution] Updated field ${fieldName} for ${consumer.email} via workflow ${workflow.name}, step ${step.stepOrder}`);
    }

    // Calculate next step execution time
    const delayMs = (step.delayDays || 0) * 24 * 60 * 60 * 1000 +
                    (step.delayHours || 0) * 60 * 60 * 1000 +
                    (step.delayMinutes || 0) * 60 * 1000;

    const nextStepIndex = workflow.steps.findIndex(s => s.stepOrder === step.stepOrder + 1);
    
    if (nextStepIndex >= 0 && nextStepIndex < workflow.steps.length) {
      // There's a next step
      const nextStepAt = new Date(Date.now() + delayMs);
      
      await prisma.emailWorkflowExecution.update({
        where: { id: execution.id },
        data: {
          currentStep: step.stepOrder + 1,
          nextStepAt: nextStepAt
        }
      });
    } else {
      // No more steps, mark as completed
      await prisma.emailWorkflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          nextStepAt: null
        }
      });
    }

  } catch (error) {
    console.error(`[Workflow Execution] Error executing step ${step.stepOrder} for workflow ${workflow.id}:`, error);
    
    // Mark execution as failed
    await prisma.emailWorkflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'cancelled'
      }
    });
  }
}

/**
 * Helper function to replace template variables
 */
function replaceTemplateVariables(content, consumer) {
  if (!content || !consumer) return content;
  
  return content
    .replace(/\{\{firstName\}\}/g, consumer.firstName || '')
    .replace(/\{\{lastName\}\}/g, consumer.lastName || '')
    .replace(/\{\{email\}\}/g, consumer.email || '')
    .replace(/\{\{store\}\}/g, consumer.store || '')
    .replace(/\{\{country\}\}/g, consumer.country || consumer.store || '');
}

/**
 * Helper function to wrap email content in template
 */
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
 * Helper function to format from email
 */
function formatFromEmail(email) {
  if (!email) return '';
  if (email.includes('<') && email.includes('>')) {
    return email;
  }
  return `SDeal – Exclusieve Deals <${email}>`;
}

module.exports = {
  executeWorkflowsForConsumer,
  executeWorkflowStep
};

