// For Vercel, Prisma Client needs to be generated from prisma/schema.prisma
// The Prisma Client should be generated during build
const { PrismaClient } = require('@prisma/client');
const sgMail = require('@sendgrid/mail');
const { generateAgreementPDF } = require('./generate-agreement-pdf');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // Set a shorter timeout for serverless environments (default is 30s)
  sgMail.setTimeout(3000); // 3 seconds
  console.log('SendGrid initialized with API key and 3s timeout');
} else {
  console.warn('SENDGRID_API_KEY not found in environment variables');
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
  
  if (!sellerEmail || !sellerEmail.trim() || sellerEmail.trim() === '') {
    console.error('Email not sent: sellerEmail is missing or empty');
    console.error('sellerEmail value:', sellerEmail);
    console.error('sellerEmail type:', typeof sellerEmail);
    return false;
  }
  
  // Ensure email is trimmed
  const trimmedEmail = sellerEmail.trim();
  
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    console.error('Email not sent: Invalid email format:', trimmedEmail);
    return false;
  }

  try {
    // Generate PDF agreement
    console.log('Generating PDF agreement...');
    let pdfAttachment = null;
    try {
      const pdfBytes = await generateAgreementPDF(packageSelection, sellerId, trimmedEmail);
      pdfAttachment = {
        content: Buffer.from(pdfBytes).toString('base64'),
        filename: `SDeal_Agreement_${sellerId}_${packageSelection.id}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      };
      console.log('PDF generated successfully, size:', pdfBytes.length, 'bytes');
    } catch (pdfError) {
      console.error('Error generating PDF (continuing without attachment):', pdfError.message);
      // Continue without PDF attachment - don't fail the email
    }
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
    
    const emailSubject = `SDeal - Package Selection Confirmation - ${packageName}`;
    
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
            
            <p style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #e2603f;">
              <strong>📄 Agreement PDF Attached</strong><br>
              A personalized copy of your SDeal Agreement with all your selected package details has been attached to this email for your records.
            </p>
            
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

📄 AGREEMENT PDF ATTACHED
A personalized copy of your SDeal Agreement with all your selected package details has been attached to this email for your records.

If you have any questions, please contact us at info@sdeal.com.

Best regards,
The SDeal Team

---
SDeal B.V. | Osloweg 110, 9723 BX Groningen, The Netherlands
KVK: 76103080 | VAT: NL 860508468B01
www.sdeal.com
    `;

    const msg = {
      to: trimmedEmail,
      cc: 'onboarding@sdeal.com',
      from: process.env.FROM_EMAIL,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };
    
    // Add PDF attachment if generated successfully
    if (pdfAttachment) {
      msg.attachments = [pdfAttachment];
      console.log('PDF attachment added to email');
    }

    console.log('Sending email via SendGrid...');
    console.log('SendGrid API key length:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0);
    console.log('SendGrid API key starts with:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 10) + '...' : 'N/A');
    console.log('Email message:', JSON.stringify({
      to: msg.to,
      cc: msg.cc,
      from: msg.from,
      subject: msg.subject,
      hasHtml: !!msg.html,
      hasText: !!msg.text
    }, null, 2));
    
    // Add timeout to prevent hanging (3 seconds for serverless - Vercel has 10s limit for hobby)
    const sendEmailWithTimeout = async () => {
      const sendPromise = sgMail.send(msg);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SendGrid timeout after 3 seconds')), 3000)
      );
      
      return Promise.race([sendPromise, timeoutPromise]);
    };
    
    console.log('About to call sgMail.send()...');
    const startTime = Date.now();
    
    try {
      console.log('Starting SendGrid send with timeout...');
      const result = await sendEmailWithTimeout();
      const duration = Date.now() - startTime;
      console.log(`SendGrid call completed in ${duration}ms`);
      console.log('SendGrid response received');
      console.log('SendGrid response type:', typeof result);
      console.log('SendGrid response is array:', Array.isArray(result));
      console.log('SendGrid response length:', result ? result.length : 0);
      
      if (result && Array.isArray(result) && result.length > 0) {
        console.log('SendGrid response[0]:', JSON.stringify(result[0], null, 2));
        console.log('SendGrid response status:', result[0]?.statusCode);
        console.log('SendGrid response headers:', result[0]?.headers ? JSON.stringify(result[0].headers, null, 2) : 'null');
        
        if (result[0].statusCode === 202 || result[0].statusCode === 200) {
          console.log(`Confirmation email sent successfully to ${trimmedEmail}`);
          return true;
        } else {
          console.error('Unexpected SendGrid status code:', result[0]?.statusCode);
          console.error('Full result:', JSON.stringify(result, null, 2));
          return false;
        }
      } else {
        console.error('Unexpected SendGrid response format:', JSON.stringify(result, null, 2));
        return false;
      }
    } catch (sendError) {
      const duration = Date.now() - startTime;
      console.error(`SendGrid call failed after ${duration}ms`);
      console.error('SendGrid error name:', sendError.name);
      console.error('SendGrid error message:', sendError.message);
      console.error('SendGrid error stack:', sendError.stack);
      
      // Check if it's a timeout error
      if (sendError.message && sendError.message.includes('timeout')) {
        console.error('SendGrid request timed out after 5 seconds');
      }
      
      // Check for SendGrid specific errors
      if (sendError.response) {
        console.error('SendGrid error response status:', sendError.response.statusCode);
        console.error('SendGrid error response body:', JSON.stringify(sendError.response.body, null, 2));
        console.error('SendGrid error response headers:', JSON.stringify(sendError.response.headers, null, 2));
      }
      
      throw sendError; // Re-throw to be caught by outer catch
    }
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
      sellerEmail: sellerEmailParam,
      sellerId: sellerIdParam,
      startDate,
      commissionPercentage,
      billingPeriod
    } = req.body;
    
    // Ensure sellerEmail is a string and trim it
    const sellerEmail = sellerEmailParam ? String(sellerEmailParam).trim() : '';
    
    console.log('Received sellerEmail:', sellerEmail);
    console.log('sellerEmail type:', typeof sellerEmail);
    console.log('sellerEmail length:', sellerEmail ? sellerEmail.length : 0);

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
    if (packageType === 'A') {
      // Package A requires commission (minimum 12%)
      if (!commissionPercentage || isNaN(parseFloat(commissionPercentage))) {
        return res.status(400).json({
          success: false,
          error: 'Commission percentage is required for Package A.'
        });
      }
      if (parseFloat(commissionPercentage) < 12) {
        return res.status(400).json({
          success: false,
          error: 'Commission percentage must be at least 12% for Package A.'
        });
      }
    } else if (packageType === 'B' || packageType === 'C') {
      if (!commissionPercentage || isNaN(parseFloat(commissionPercentage)) || parseFloat(commissionPercentage) < 4) {
        return res.status(400).json({
          success: false,
          error: `Commission percentage must be at least 4% for Package ${packageType}.`
        });
      }
    }

    // Get IP address
    const ipAddress = getClientIP(req);

    // Prepare commission percentage - ensure it's a number
    // For Package A, commission is required (validated above)
    // For Package B/C, commission is required (validated above)
    const commissionValue = parseFloat(commissionPercentage);
    
    // Prepare billing period - ensure it's set
    const billingValue = billingPeriod && ['monthly', 'yearly'].includes(billingPeriod) 
      ? billingPeriod 
      : 'monthly';
    
    console.log('Saving to database with values:');
    console.log('- commissionPercentage:', commissionValue);
    console.log('- commissionPercentage type:', typeof commissionValue);
    console.log('- billingPeriod:', billingValue);
    console.log('- billingPeriod type:', typeof billingValue);
    
    // Create package selection record
    const dataToSave = {
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
      commissionPercentage: commissionValue,
      billingPeriod: billingValue
    };
    
    console.log('Data to save:', JSON.stringify(dataToSave, null, 2));
    
    const packageSelection = await prisma.packageSelection.create({
      data: dataToSave
    });
    
    console.log('Package selection saved with ID:', packageSelection.id);
    console.log('Saved commissionPercentage:', packageSelection.commissionPercentage);
    console.log('Saved commissionPercentage type:', typeof packageSelection.commissionPercentage);
    console.log('Saved billingPeriod:', packageSelection.billingPeriod);
    console.log('Saved billingPeriod type:', typeof packageSelection.billingPeriod);
    
    // Verify the saved data
    const verifyRecord = await prisma.packageSelection.findUnique({
      where: { id: packageSelection.id },
      select: {
        id: true,
        commissionPercentage: true,
        billingPeriod: true,
        package: true
      }
    });
    
    console.log('Verified record from database:', JSON.stringify(verifyRecord, null, 2));

    // Send confirmation email (non-blocking - don't fail if email fails)
    console.log('Package selection saved, checking email...');
    console.log('sellerEmail from request:', sellerEmail);
    console.log('sellerEmail type:', typeof sellerEmail);
    console.log('sellerEmail trimmed:', sellerEmail ? sellerEmail.trim() : 'null/undefined');
    console.log('sellerEmail from database:', packageSelection.sellerEmail);
    
    // Use sellerEmail from request first, then from database, but ensure it's not empty
    // sellerEmail should always be provided from the frontend form
    const emailToSend = sellerEmail && sellerEmail.trim() !== '' 
      ? sellerEmail.trim() 
      : (packageSelection.sellerEmail && packageSelection.sellerEmail.trim() !== '' 
          ? packageSelection.sellerEmail.trim() 
          : null);
    
    console.log('Final emailToSend:', emailToSend);
    console.log('emailToSend truthy:', !!emailToSend);
    console.log('emailToSend length:', emailToSend ? emailToSend.length : 0);
    
    // Send email before response (but don't block if it fails)
    let emailSent = false;
    if (emailToSend && emailToSend.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSend.trim())) {
      console.log('Sending email to:', emailToSend);
      console.log('Calling sendConfirmationEmail function...');
      
      try {
        // Try to send email with a short timeout, but don't wait too long
        const emailPromise = sendConfirmationEmail(packageSelection, emailToSend.trim(), sellerId.trim(), language);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 2000));
        
        emailSent = await Promise.race([emailPromise, timeoutPromise]);
        
        if (emailSent) {
          console.log('Email sent successfully to:', emailToSend);
        } else {
          console.log('Email sending timed out or returned false - will continue in background');
          // Continue in background (but may be cancelled by Vercel)
          sendConfirmationEmail(packageSelection, emailToSend.trim(), sellerId.trim(), language)
            .then(success => {
              console.log('Background email sending completed:', success);
            })
            .catch(err => {
              console.error('Background email sending failed:', err.message);
            });
        }
      } catch (emailError) {
        console.error('Email sending error (non-blocking):', emailError.message);
        // Continue even if email fails
      }
    } else {
      console.log('No email address provided, skipping email send');
      console.log('sellerEmail value:', sellerEmail);
      console.log('packageSelection.sellerEmail value:', packageSelection.sellerEmail);
      console.log('emailToSend value:', emailToSend);
      console.log('emailToSend validation result:', emailToSend ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSend.trim()) : false);
    }

    // Send response
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

