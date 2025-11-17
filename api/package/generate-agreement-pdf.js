const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

/**
 * Generate a filled SDeal Agreement PDF with customer data
 * @param {Object} packageSelection - The package selection data from database
 * @param {string} sellerId - Seller ID
 * @param {string} sellerEmail - Seller email
 * @returns {Promise<Uint8Array>} - PDF bytes
 */
const generateAgreementPDF = async (packageSelection, sellerId, sellerEmail) => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();
    
    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Colors
    const primaryColor = rgb(0.886, 0.376, 0.247); // #e2603f
    const textColor = rgb(0.2, 0.2, 0.2);
    const darkColor = rgb(0.1, 0.1, 0.1);
    
    let yPosition = height - 50;
    
    // Header
    page.drawText('SDeal Seller Agreement', {
      x: 50,
      y: yPosition,
      size: 24,
      font: helveticaBoldFont,
      color: primaryColor,
    });
    
    yPosition -= 30;
    
    page.drawText(`Version: ${packageSelection.agreementVersion || 'SellerAgreement_6.3_2026-01'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 40;
    
    // Document ID and Timestamps
    const documentId = packageSelection.id;
    const now = new Date();
    const generationDate = now.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const generationTime = now.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Amsterdam'
    });
    const isoTimestamp = now.toISOString();
    
    // Document Reference Number
    page.drawText(`Document ID: ${documentId}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaBoldFont,
      color: darkColor,
    });
    
    yPosition -= 20;
    
    page.drawText(`Generated: ${generationDate} om ${generationTime} (CET/CEST)`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 20;
    
    page.drawText(`ISO Timestamp: ${isoTimestamp}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    yPosition -= 40;
    
    // Section: Party Information (Seller only - the signing party)
    page.drawText('Seller Information', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: darkColor,
    });
    
    yPosition -= 25;
    
    // Only show Seller ID for existing customers (not for new customers or pending)
    if (!packageSelection.isNewCustomer && sellerId && !sellerId.startsWith('NEW-')) {
      page.drawText(`Seller ID: ${sellerId}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: textColor,
      });
      yPosition -= 20;
    }
    
    if (sellerEmail) {
      page.drawText(`Seller Email: ${sellerEmail}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: textColor,
      });
      yPosition -= 20;
    }
    
    // Add new customer details if it's a new customer
    if (packageSelection.isNewCustomer) {
      yPosition -= 20;
      
      if (packageSelection.companyName) {
        page.drawText(`Company Name: ${packageSelection.companyName}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      }
      
      if (packageSelection.firstName || packageSelection.lastName) {
        const fullName = `${packageSelection.firstName || ''} ${packageSelection.lastName || ''}`.trim();
        if (fullName) {
          page.drawText(`Contact Person: ${fullName}`, {
            x: 50,
            y: yPosition,
            size: 11,
            font: helveticaFont,
            color: textColor,
          });
          yPosition -= 20;
        }
      }
      
      if (packageSelection.street) {
        page.drawText(`Address: ${packageSelection.street}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      }
      
      if (packageSelection.postalCode || packageSelection.city) {
        const addressLine = `${packageSelection.postalCode || ''} ${packageSelection.city || ''}`.trim();
        if (addressLine) {
          page.drawText(addressLine, {
            x: 50,
            y: yPosition,
            size: 11,
            font: helveticaFont,
            color: textColor,
          });
          yPosition -= 20;
        }
      }
      
      if (packageSelection.country) {
        page.drawText(`Country: ${packageSelection.country}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      }
      
      if (packageSelection.phone) {
        page.drawText(`Phone: ${packageSelection.phone}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      }
      
      if (packageSelection.kvkNumber) {
        page.drawText(`KVK Number: ${packageSelection.kvkNumber}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      }
      
      if (packageSelection.vatNumber) {
        page.drawText(`VAT Number: ${packageSelection.vatNumber}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      }
      
      if (packageSelection.iban) {
        page.drawText(`IBAN: ${packageSelection.iban}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      }
      
      if (packageSelection.bic) {
        page.drawText(`BIC: ${packageSelection.bic}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      }
    }
    
    yPosition -= 40;
    
    // Section: Package Selection
    page.drawText('Selected Package', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: darkColor,
    });
    
    yPosition -= 25;
    
    const packageName = packageSelection.package === 'A' ? 'Package 1' 
      : packageSelection.package === 'B' ? 'Package 2' 
      : 'Package 3';
    
    page.drawText(`Package: ${packageName} (${packageSelection.package})`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 20;
    
    // Start Date
    const startDateText = packageSelection.startDate === 'immediate' 
      ? 'Immediate' 
      : packageSelection.startDate || 'January 1, 2026';
    
    page.drawText(`Start Date: ${startDateText}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 20;
    
    // Commission
    if (packageSelection.commissionPercentage) {
      page.drawText(`Commission Percentage: ${packageSelection.commissionPercentage}%`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: textColor,
      });
      yPosition -= 20;
    }
    
    // Billing Period
    const billingText = packageSelection.billingPeriod === 'yearly' 
      ? 'Yearly (30% discount)' 
      : 'Monthly';
    
    page.drawText(`Billing Period: ${billingText}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 40;
    
    // Section: Add-ons
    const addons = [];
    if (packageSelection.addonDealCSS) {
      addons.push('DEAL CSS – Comparison Shopping Service – €24,95 p/m');
    }
    if (packageSelection.addonCAAS) {
      addons.push('CAAS – Clicks as a Service (CPC to your own webshop) – €39,95 p/m');
    }
    if (packageSelection.addonFairifAI) {
      addons.push('Review reputation management (Fairifai)');
    }
    
    if (addons.length > 0) {
      page.drawText('Selected Add-ons', {
        x: 50,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: darkColor,
      });
      
      yPosition -= 25;
      
      addons.forEach(addon => {
        page.drawText(`• ${addon}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: textColor,
        });
        yPosition -= 20;
      });
      
      yPosition -= 20;
    }
    
    // Section: Agreement Terms
    yPosition -= 20;
    
    page.drawText('Agreement Terms', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: darkColor,
    });
    
    yPosition -= 25;
    
    const termsText = [
      'This agreement is effective as of the start date specified above.',
      'The seller agrees to the SDeal Seller Agreement 6.3 (2026) and the SDeal Seller Terms & Conditions (2026).',
      'All terms and conditions as specified in the agreement documents apply.',
      'This document serves as confirmation of the package selection and agreement acceptance.'
    ];
    
    let currentPage = page;
    termsText.forEach(term => {
      // Check if we need a new page
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }
      
      currentPage.drawText(term, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: textColor,
        maxWidth: width - 100,
      });
      yPosition -= 25;
    });
    
    yPosition -= 30;
    
    // Signature section
    if (yPosition < 150) {
      currentPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }
    
    currentPage.drawText('Acceptance', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: darkColor,
    });
    
    yPosition -= 30;
    
    currentPage.drawText('By submitting this form, the seller has accepted the terms and conditions.', {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor,
      maxWidth: width - 100,
    });
    
    yPosition -= 20;
    
    currentPage.drawText(`Agreement Accepted: ${packageSelection.agreementAccepted ? 'Yes' : 'No'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 20;
    
    currentPage.drawText(`Language: ${packageSelection.language.toUpperCase()}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 20;
    
    currentPage.drawText(`IP Address: ${packageSelection.ipAddress || 'Not recorded'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 20;
    
    // Database record creation timestamp
    const createdAt = new Date(packageSelection.createdAt);
    const createdAtFormatted = createdAt.toLocaleString('nl-NL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Amsterdam'
    });
    
    currentPage.drawText(`Database Record Created: ${createdAtFormatted} (CET/CEST)`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor,
    });
    
    yPosition -= 20;
    
    // Document verification info
    currentPage.drawText('Document Verification', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: darkColor,
    });
    
    yPosition -= 20;
    
    currentPage.drawText(`This document can be verified using Document ID: ${documentId}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: helveticaFont,
      color: textColor,
      maxWidth: width - 100,
    });
    
    yPosition -= 15;
    
    currentPage.drawText(`Contact SDeal at info@sdeal.com with this Document ID for verification.`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: helveticaFont,
      color: textColor,
      maxWidth: width - 100,
    });
    
    // Footer
    const footerY = 30;
    currentPage.drawText('SDeal B.V. | Osloweg 110, 9723 BX Groningen, The Netherlands', {
      x: 50,
      y: footerY,
      size: 8,
      font: helveticaFont,
      color: textColor,
    });
    
    currentPage.drawText('KVK: 76103080 | VAT: NL 860508468B01 | www.sdeal.com', {
      x: 50,
      y: footerY - 15,
      size: 8,
      font: helveticaFont,
      color: textColor,
    });
    
    // Load and append the original SDeal Agreement PDF
    console.log('Loading original SDeal Agreement PDF...');
    try {
      let agreementPdfBytes = null;
      
      // Try multiple possible paths for the agreement PDF (for local development)
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'images', 'SDeal Agreement.pdf'),
        path.join(process.cwd(), '..', 'public', 'images', 'SDeal Agreement.pdf'),
        path.join(__dirname, '..', '..', 'public', 'images', 'SDeal Agreement.pdf'),
        path.join(__dirname, '..', '..', '..', 'public', 'images', 'SDeal Agreement.pdf'),
      ];
      
      // Try to load from file system first
      for (const pdfPath of possiblePaths) {
        try {
          if (fs.existsSync(pdfPath)) {
            agreementPdfBytes = fs.readFileSync(pdfPath);
            console.log('Found agreement PDF at:', pdfPath);
            break;
          }
        } catch (err) {
          // Continue to next path
          continue;
        }
      }
      
      // If not found locally, try to fetch from URL (for Vercel/serverless)
      if (!agreementPdfBytes) {
        try {
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : process.env.BASE_URL || 'https://www.sdeal.com';
          const pdfUrl = `${baseUrl}/images/SDeal%20Agreement.pdf`;
          
          console.log('Attempting to fetch agreement PDF from URL:', pdfUrl);
          
          // Use native fetch (available in Node.js 18+ and Vercel)
          const response = await fetch(pdfUrl);
          
          if (response.ok) {
            agreementPdfBytes = await response.arrayBuffer();
            console.log('Successfully fetched agreement PDF from URL');
          } else {
            console.warn('Failed to fetch PDF from URL, status:', response.status);
          }
        } catch (fetchError) {
          console.warn('Error fetching PDF from URL:', fetchError.message);
        }
      }
      
      if (agreementPdfBytes) {
        // Load the existing PDF
        const existingPdfDoc = await PDFDocument.load(agreementPdfBytes);
        const existingPages = existingPdfDoc.getPages();
        
        console.log(`Copying ${existingPages.length} pages from original agreement PDF...`);
        
        // Copy all pages from the original agreement PDF
        for (let i = 0; i < existingPages.length; i++) {
          const [copiedPage] = await pdfDoc.copyPages(existingPdfDoc, [i]);
          pdfDoc.addPage(copiedPage);
        }
        
        console.log('Successfully appended original agreement PDF pages');
      } else {
        console.warn('Original SDeal Agreement PDF not found. Continuing without it.');
        console.warn('Searched paths:', possiblePaths);
      }
    } catch (error) {
      console.error('Error loading original agreement PDF (continuing without it):', error.message);
      // Continue without the original PDF - don't fail the entire generation
    }
    
    // Set PDF metadata for legal validity
    pdfDoc.setTitle(`SDeal Seller Agreement - ${sellerId} - ${documentId}`);
    pdfDoc.setSubject(`SDeal Seller Agreement - Document ID: ${documentId}`);
    pdfDoc.setAuthor('SDeal B.V.');
    pdfDoc.setCreator('SDeal Agreement Generator');
    pdfDoc.setProducer('SDeal B.V.');
    pdfDoc.setCreationDate(now);
    pdfDoc.setModificationDate(now);
    
    // Add keywords for searchability
    pdfDoc.setKeywords([
      'SDeal',
      'Seller Agreement',
      documentId,
      sellerId,
      packageSelection.package,
      'Agreement'
    ]);
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

module.exports = { generateAgreementPDF };

