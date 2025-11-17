const { PrismaClient } = require('@prisma/client');
const { createMollieClient } = require('@mollie/api-client');

// Use a singleton pattern for Prisma Client in serverless functions
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize Mollie client
if (!process.env.MOLLIE_API_KEY) {
  console.warn('MOLLIE_API_KEY not found in environment variables');
}
const mollieClient = process.env.MOLLIE_API_KEY 
  ? createMollieClient({ apiKey: process.env.MOLLIE_API_KEY })
  : null;

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  // Check if Mollie client is initialized
  if (!mollieClient) {
    console.error('Mollie client not initialized - MOLLIE_API_KEY missing');
    // Still return 200 to Mollie to prevent retries
    return res.status(200).json({ received: true, error: 'Mollie API key not configured' });
  }

  try {
    const { id: paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required.'
      });
    }

    // Get payment status from Mollie
    const payment = await mollieClient.payments.get(paymentId);

    // Find package selection by payment ID
    const packageSelection = await prisma.packageSelection.findFirst({
      where: { molliePaymentId: paymentId }
    });

    if (!packageSelection) {
      console.error('Package selection not found for payment ID:', paymentId);
      return res.status(404).json({
        success: false,
        error: 'Package selection not found.'
      });
    }

    // Update package selection based on payment status
    if (payment.status === 'paid') {
      // Payment successful - check for mandate (recurring payment setup)
      if (payment.mandateId) {
        await prisma.packageSelection.update({
          where: { id: packageSelection.id },
          data: {
            mollieMandateId: payment.mandateId,
            // You might want to add a paymentStatus field here
          }
        });
      }

      // TODO: Set up recurring subscription if mandate exists
      // This would involve creating a subscription in Mollie
      // For now, we just store the mandate ID for future recurring payments
    }

    // Always return 200 to Mollie to acknowledge webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    // Still return 200 to Mollie to prevent retries for invalid requests
    res.status(200).json({ received: true, error: error.message });
  }
};

