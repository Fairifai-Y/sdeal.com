// API endpoint to send email with package link
// This can be called from an admin panel or automated system

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { sellerId, sellerEmail, language = 'nl' } = req.body;

    if (!sellerId || !sellerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Seller ID and email are required.'
      });
    }

    // Generate the package link with seller ID
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.BASE_URL || 'https://www.sdeal.com';
    
    const packageLink = `${baseUrl}/${language}/package?sellerId=${encodeURIComponent(sellerId)}`;

    // TODO: Implement actual email sending here
    // You can use:
    // - Nodemailer with SMTP
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Or any other email service

    // For now, we'll just return the link
    // In production, you would send an email with this link

    res.json({
      success: true,
      message: 'Email link generated successfully',
      data: {
        sellerId,
        sellerEmail,
        packageLink,
        // In production, this would indicate if email was sent
        emailSent: false // Set to true when email is actually sent
      }
    });
  } catch (error) {
    console.error('Error generating email link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate email link',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

