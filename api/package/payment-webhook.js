const { PrismaClient } = require('@prisma/client');
const { createMollieClient } = require('@mollie/api-client');
const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sgMail.setTimeout(5000);
}

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

const packageLabel = (pkg) => ({ A: 'Package 1', B: 'Package 2', C: 'Package 3' }[pkg] || `Package ${pkg}`);

/** Send a short notification email that the payment succeeded (same address as package registration CC: onboarding@sdeal.com or NOTIFICATION_EMAIL). */
async function sendPaymentSuccessNotification(packageSelection) {
  const to = (process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'onboarding@sdeal.com').trim();
  if (!to || !process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL) return;
  try {
    const subject = 'SDeal – Betaling geslaagd';
    const seller = [packageSelection.firstName, packageSelection.lastName].filter(Boolean).join(' ') || packageSelection.sellerEmail || '–';
    const pkg = packageLabel(packageSelection.package);
    const text = [
      'De betaling is succesvol afgerond.',
      '',
      `Seller: ${seller}`,
      packageSelection.sellerEmail ? `Email: ${packageSelection.sellerEmail}` : '',
      `Pakket: ${pkg}`,
      `PackageSelection ID: ${packageSelection.id}`,
    ].filter(Boolean).join('\n');
    await sgMail.send({
      to: to.trim(),
      from: process.env.FROM_EMAIL,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
    });
  } catch (err) {
    console.error('Payment success notification email failed:', err.message);
  }
}

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
          }
        });
      }

      // Notify admin that payment succeeded (if NOTIFICATION_EMAIL or ADMIN_EMAIL is set)
      await sendPaymentSuccessNotification(packageSelection);
    }

    // Always return 200 to Mollie to acknowledge webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    // Still return 200 to Mollie to prevent retries for invalid requests
    res.status(200).json({ received: true, error: error.message });
  }
};

