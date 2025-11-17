const { PrismaClient } = require('@prisma/client');
const { createMollieClient } = require('@mollie/api-client');

// Use a singleton pattern for Prisma Client in serverless functions
// This prevents creating multiple connections in serverless environments
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
    return res.status(500).json({
      success: false,
      error: 'Mollie API key is not configured. Please set MOLLIE_API_KEY environment variable.'
    });
  }

  try {
    const { packageSelectionId } = req.body;

    if (!packageSelectionId) {
      return res.status(400).json({
        success: false,
        error: 'Package selection ID is required.'
      });
    }

    // Get package selection from database
    const packageSelection = await prisma.packageSelection.findUnique({
      where: { id: packageSelectionId }
    });

    if (!packageSelection) {
      return res.status(404).json({
        success: false,
        error: 'Package selection not found.'
      });
    }

    // Calculate total price
    const packagePrices = {
      'A': 29.00,
      'B': 49.00,
      'C': 99.00
    };

    const addonPrices = {
      dealCSS: 24.95,
      caas: 39.95
    };

    let totalAmount = packagePrices[packageSelection.package];

    if (packageSelection.addonDealCSS) {
      totalAmount += addonPrices.dealCSS;
    }
    if (packageSelection.addonCAAS) {
      totalAmount += addonPrices.caas;
    }

    // Apply yearly discount if applicable
    if (packageSelection.billingPeriod === 'yearly') {
      totalAmount = totalAmount * 12 * 0.7; // 30% discount
    }

    // Create Mollie customer (if not exists)
    let mollieCustomerId = packageSelection.mollieCustomerId;

    if (!mollieCustomerId && packageSelection.sellerEmail) {
      try {
        const customer = await mollieClient.customers.create({
          name: packageSelection.companyName || 
                `${packageSelection.firstName || ''} ${packageSelection.lastName || ''}`.trim() ||
                'SDeal Customer',
          email: packageSelection.sellerEmail
        });

        mollieCustomerId = customer.id;

        // Update package selection with Mollie customer ID
        await prisma.packageSelection.update({
          where: { id: packageSelectionId },
          data: { mollieCustomerId: mollieCustomerId }
        });
      } catch (error) {
        console.error('Error creating Mollie customer:', error);
        // Continue without customer ID if creation fails
      }
    }

    // Determine base URL for redirects and webhooks
    // Priority: 1. req.headers.origin (from request), 2. VERCEL_URL (Vercel auto), 3. BASE_URL (env), 4. fallback
    const baseUrl = req.headers.origin 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || process.env.BASE_URL 
      || 'https://www.sdeal.com';

    // Create first payment to set up recurring payment (mandate)
    // For recurring payments, we need to use sequenceType: 'first' to create a mandate
    // Note: For recurring payments, only certain methods support mandates:
    // - directdebit (SEPA Direct Debit)
    // - creditcard
    // - paypal (limited)
    // We'll let Mollie determine available methods or use directdebit/creditcard
    const paymentData = {
      amount: {
        currency: 'EUR',
        value: totalAmount.toFixed(2)
      },
      description: `SDeal Package ${packageSelection.package} - ${packageSelection.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}`,
      redirectUrl: `${baseUrl}/package?payment=success&id=${packageSelectionId}`,
      webhookUrl: `${baseUrl}/api/package/payment-webhook`,
      sequenceType: 'first', // First payment to set up recurring mandate
      // Only specify methods that support recurring payments (mandates)
      method: ['directdebit', 'creditcard'], // SEPA Direct Debit and Creditcard support mandates
      customerId: mollieCustomerId || undefined
    };

    const payment = await mollieClient.payments.create(paymentData);

    // Update package selection with payment ID
    await prisma.packageSelection.update({
      where: { id: packageSelectionId },
      data: { 
        molliePaymentId: payment.id,
        mollieCustomerId: mollieCustomerId || undefined
      }
    });

    res.json({
      success: true,
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id
    });

  } catch (error) {
    console.error('Error creating Mollie payment:', error);
    console.error('Error stack:', error.stack);
    
    // Return detailed error in development, generic in production
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      : undefined;
    
    res.status(500).json({
      success: false,
      error: 'Failed to create payment',
      details: errorDetails
    });
  }
};

