const prisma = require('../lib/prisma');
const { createMollieClient } = require('@mollie/api-client');

// Initialize Mollie client with MOLLIE_API_KEY_2
if (!process.env.MOLLIE_API_KEY_2) {
  console.warn('MOLLIE_API_KEY_2 not found in environment variables');
}
const mollieClient = process.env.MOLLIE_API_KEY_2 
  ? createMollieClient({ apiKey: process.env.MOLLIE_API_KEY_2 })
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
    console.error('Mollie client not initialized - MOLLIE_API_KEY_2 missing');
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

    // Find registration by payment ID
    const registration = await prisma.lifetimeDiscountRegistration.findUnique({
      where: { molliePaymentId: paymentId }
    });

    if (!registration) {
      console.error('Lifetime discount registration not found for payment ID:', paymentId);
      // Still return 200 to Mollie
      return res.status(200).json({ received: true, error: 'Registration not found' });
    }

    // Update registration based on payment status
    if (payment.status === 'paid') {
      // Payment successful - activate discount after 24 hours
      const activatedAt = new Date();
      activatedAt.setHours(activatedAt.getHours() + 24);

      await prisma.lifetimeDiscountRegistration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: 'paid',
          activatedAt: activatedAt
        }
      });

      console.log(`Lifetime discount activated for ${registration.email}, will be available at ${activatedAt}`);
    } else if (payment.status === 'failed' || payment.status === 'expired' || payment.status === 'canceled') {
      await prisma.lifetimeDiscountRegistration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: payment.status === 'canceled' ? 'cancelled' : 'failed'
        }
      });
    }

    // Always return 200 to Mollie to acknowledge webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    // Still return 200 to Mollie to prevent retries for invalid requests
    res.status(200).json({ received: true, error: error.message });
  }
};

