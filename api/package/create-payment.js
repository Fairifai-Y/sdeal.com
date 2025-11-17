const { PrismaClient } = require('@prisma/client');
const { createMollieClient } = require('@mollie/api-client');

const prisma = new PrismaClient();

// Initialize Mollie client
const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
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
    const paymentData = {
      amount: {
        currency: 'EUR',
        value: totalAmount.toFixed(2)
      },
      description: `SDeal Package ${packageSelection.package} - ${packageSelection.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}`,
      redirectUrl: `${baseUrl}/package?payment=success&id=${packageSelectionId}`,
      webhookUrl: `${baseUrl}/api/package/payment-webhook`,
      sequenceType: 'first', // First payment to set up recurring mandate
      method: ['ideal', 'creditcard', 'bancontact', 'sofort', 'sepa'], // Supported methods for recurring
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
    res.status(500).json({
      success: false,
      error: 'Failed to create payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

