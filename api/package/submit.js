// For Vercel, Prisma Client needs to be generated from prisma/schema.prisma
// The Prisma Client should be generated during build
const { PrismaClient } = require('@prisma/client');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Use a singleton pattern for Prisma Client in serverless functions
// This prevents creating multiple connections in serverless environments
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Get client IP address
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

// Package names mapping
const getPackageName = (packageType) => {
  const names = {
    'A': 'Package 1',
    'B': 'Package 2',
    'C': 'Package 3'
  };
  return names[packageType] || `Package ${packageType}`;
};

// Send confirmation email
const sendConfirmationEmail = async (packageSelection, sellerEmail, sellerId, language = 'en') => {
  console.log('Attempting to send email...');
  console.log('SENDGRID_API_KEY present:', !!process.env.SENDGRID_API_KEY);
  console.log('FROM_EMAIL present:', !!process.env.FROM_EMAIL);
  console.log('FROM_EMAIL value:', process.env.FROM_EMAIL);
  console.log('sellerEmail:', sellerEmail);
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Email not sent: SENDGRID_API_KEY is missing');
    return false;
  }
  
  if (!process.env.FROM_EMAIL) {
    console.error('Email not sent: FROM_EMAIL is missing');
    return false;
  }
  
  if (!sellerEmail) {
    console.error('Email not sent: sellerEmail is missing');
    return false;
  }

  try {
    const packageName = getPackageName(packageSelection.package);
    const startDateText = packageSelection.startDate === 'immediate' 
      ? 'Immediate' 
      : 'January 1, 2026';
    
    const billingPeriodText = packageSelection.billingPeriod === 'yearly' 
      ? 'Yearly (30% discount)' 
      : 'Monthly';
    
    const commissionText = packageSelection.commissionPercentage 
      ? `${packageSelection.commissionPercentage}%`
      : (packageSelection.package === 'A' ? '12% (standard)' : 'To be determined');
    
    const addons = [];
    if (packageSelection.addonDealCSS) addons.push('DEAL CSS – Comparison Shopping Service – €24,95 p/m');
    if (packageSelection.addonCAAS) addons.push('CAAS – Clicks as a Service (CPC to your own webshop) – €39,95 p/m');
    if (packageSelection.addonFairifAI) addons.push('Review reputation management (Fairifai)');
    
    const addonsText = addons.length > 0 ? addons.join('\n• ') : 'None';
    
    const emailSubject = `Package Selection Confirmation - ${packageName}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e2603f; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #e2603f; }
          .label { font-weight: bold; color: #666; }
          .value { margin-top: 5px; color: #333; }
          .footer { margin-top: 20px; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Package Selection Confirmed</h1>
          </div>
          <div class="content">
            <p>Dear Seller,</p>
            <p>Thank you for selecting your SDeal package. Your selection has been successfully saved.</p>
            
            <div class="details">
              <div class="label">Package:</div>
              <div class="value">${packageName}</div>
            </div>
            
            <div class="details">
              <div class="label">Seller ID:</div>
              <div class="value">${sellerId}</div>
            </div>
            
            <div class="details">
              <div class="label">Start Date:</div>
              <div class="value">${startDateText}</div>
            </div>
            
            <div class="details">
              <div class="label">Commission Percentage:</div>
              <div class="value">${commissionText}</div>
            </div>
            
            <div class="details">
              <div class="label">Billing Period:</div>
              <div class="value">${billingPeriodText}</div>
            </div>
            
            ${addons.length > 0 ? `
            <div class="details">
              <div class="label">Selected Add-ons:</div>
              <div class="value">• ${addonsText}</div>
            </div>
            ` : ''}
            
            <p style="margin-top: 20px;">Your package selection will be effective as of ${startDateText}.</p>
            
            <p>If you have any questions, please contact us at <a href="mailto:info@sdeal.com">info@sdeal.com</a>.</p>
            
            <p>Best regards,<br>The SDeal Team</p>
          </div>
          
          <div class="footer">
            <p>SDeal B.V. | Osloweg 110, 9723 BX Groningen, The Netherlands</p>
            <p>KVK: 76103080 | VAT: NL 860508468B01</p>
            <p><a href="https://www.sdeal.com">www.sdeal.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const emailText = `
Package Selection Confirmation

Dear Seller,

Thank you for selecting your SDeal package. Your selection has been successfully saved.

Package: ${packageName}
Seller ID: ${sellerId}
Start Date: ${startDateText}
Commission Percentage: ${commissionText}
Billing Period: ${billingPeriodText}
${addons.length > 0 ? `Selected Add-ons:\n• ${addonsText}` : 'Selected Add-ons: None'}

Your package selection will be effective as of ${startDateText}.

If you have any questions, please contact us at info@sdeal.com.

Best regards,
The SDeal Team

---
SDeal B.V. | Osloweg 110, 9723 BX Groningen, The Netherlands
KVK: 76103080 | VAT: NL 860508468B01
www.sdeal.com
    `;

    const msg = {
      to: sellerEmail,
      from: process.env.FROM_EMAIL,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };

    console.log('Sending email via SendGrid...');
    console.log('Email message:', JSON.stringify({
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      hasHtml: !!msg.html,
      hasText: !!msg.text
    }, null, 2));
    
    const result = await sgMail.send(msg);
    console.log('SendGrid response status:', result[0]?.statusCode);
    console.log('SendGrid response headers:', result[0]?.headers);
    console.log(`Confirmation email sent successfully to ${sellerEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.response) {
      console.error('SendGrid error response status:', error.response.statusCode);
      console.error('SendGrid error response body:', JSON.stringify(error.response.body, null, 2));
    }
    // Don't throw error - email failure shouldn't break the API response
    return false;
  }
};

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const {
      package: packageType,
      addons,
      agreementAccepted,
      language,
      sellerEmail,
      sellerId: sellerIdParam,
      startDate,
      commissionPercentage,
      billingPeriod
    } = req.body;

    // Validation
    if (!packageType || !['A', 'B', 'C'].includes(packageType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid package selection. Must be A, B, or C.'
      });
    }

    if (!agreementAccepted) {
      return res.status(400).json({
        success: false,
        error: 'Agreement must be accepted.'
      });
    }

    if (!language || !['en', 'nl', 'de', 'fr'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language. Must be en, nl, de, or fr.'
      });
    }

    const sellerId = sellerIdParam || '';
    
    if (!sellerId || sellerId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Seller ID is required.'
      });
    }

    if (!startDate || !['immediate', '2026-01-01'].includes(startDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start date. Must be "immediate" or "2026-01-01".'
      });
    }

    // Validate commission percentage based on package
    if (packageType === 'B' || packageType === 'C') {
      if (!commissionPercentage || isNaN(parseFloat(commissionPercentage)) || parseFloat(commissionPercentage) < 4) {
        return res.status(400).json({
          success: false,
          error: `Commission percentage must be at least 4% for Package ${packageType}.`
        });
      }
    } else if (packageType === 'A' && commissionPercentage) {
      if (isNaN(parseFloat(commissionPercentage)) || parseFloat(commissionPercentage) < 12) {
        return res.status(400).json({
          success: false,
          error: 'Commission percentage must be at least 12% for Package A.'
        });
      }
    }

    // Get IP address
    const ipAddress = getClientIP(req);

    // Create package selection record
    const packageSelection = await prisma.packageSelection.create({
      data: {
        package: packageType,
        addonDealCSS: addons?.dealCSS || false,
        addonCAAS: addons?.caas || false,
        addonFairifAI: addons?.fairifAI || false,
        agreementAccepted,
        language,
        ipAddress,
        sellerEmail: sellerEmail || null,
        sellerId: sellerId.trim(),
        startDate: startDate,
        commissionPercentage: commissionPercentage ? parseFloat(commissionPercentage) : null,
        billingPeriod: billingPeriod || 'monthly'
      }
    });

    // Send confirmation email (non-blocking - don't fail if email fails)
    console.log('Package selection saved, checking email...');
    console.log('sellerEmail from request:', sellerEmail);
    console.log('sellerEmail from database:', packageSelection.sellerEmail);
    
    const emailToSend = sellerEmail || packageSelection.sellerEmail;
    
    if (emailToSend) {
      console.log('Sending email to:', emailToSend);
      sendConfirmationEmail(packageSelection, emailToSend, sellerId.trim(), language)
        .then(success => {
          if (success) {
            console.log('Email sent successfully to:', emailToSend);
          } else {
            console.log('Email sending returned false');
          }
        })
        .catch(err => {
          console.error('Failed to send confirmation email:', err);
          console.error('Error details:', JSON.stringify(err, null, 2));
          if (err.response) {
            console.error('SendGrid response:', err.response.body);
          }
          // Continue even if email fails
        });
    } else {
      console.log('No email address provided, skipping email send');
    }

    res.json({
      success: true,
      message: 'Package selection saved successfully',
      data: {
        id: packageSelection.id,
        package: packageSelection.package,
        createdAt: packageSelection.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving package selection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save package selection',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  // Note: Don't disconnect Prisma in serverless functions to allow connection reuse
};

