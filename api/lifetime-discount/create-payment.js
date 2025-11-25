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
    return res.status(500).json({
      success: false,
      error: 'Mollie API key is not configured. Please set MOLLIE_API_KEY_2 environment variable.'
    });
  }

  try {
    const { email, language = 'en' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required.'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format.'
      });
    }

    // Check if email already exists
    const existing = await prisma.lifetimeDiscountRegistration.findUnique({
      where: { email }
    });

    if (existing && existing.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'This email is already registered for lifetime discounts.'
      });
    }

    // Determine base URL for redirects and webhooks
    const baseUrl = req.headers.origin 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || process.env.BASE_URL 
      || 'https://www.sdeal.com';

    // Get localized success URL based on language
    const languagePrefix = language === 'en' ? '' : `/${language}`;
    const redirectUrl = `${baseUrl}${languagePrefix}/Lifetime-Discount-Group?payment=success`;

    // Create payment in Mollie
    const paymentData = {
      amount: {
        currency: 'EUR',
        value: '14.95'
      },
      description: 'SDeal Lifetime Discount Group - €14.95',
      redirectUrl: redirectUrl,
      webhookUrl: `${baseUrl}/api/lifetime-discount/payment-webhook`,
      metadata: {
        email: email,
        language: language,
        type: 'lifetime_discount'
      }
    };

    const payment = await mollieClient.payments.create(paymentData);

    // Create or update registration in database
    if (existing) {
      await prisma.lifetimeDiscountRegistration.update({
        where: { email },
        data: {
          molliePaymentId: payment.id,
          paymentStatus: 'pending',
          language: language
        }
      });
    } else {
      await prisma.lifetimeDiscountRegistration.create({
        data: {
          email: email,
          language: language,
          paymentStatus: 'pending',
          molliePaymentId: payment.id
        }
      });
    }

    return res.status(200).json({
      success: true,
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment.'
    });
  }
};

