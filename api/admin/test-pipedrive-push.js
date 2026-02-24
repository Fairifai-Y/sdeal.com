const { PrismaClient } = require('@prisma/client');
const { pushAanmeldingToPipedrive } = require('../lib/pipedrive');
const { generateAgreementPDF } = require('../package/generate-agreement-pdf');

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Test: push één seller (uit PackageSelection) naar Pipedrive.
 * GET of POST: ?sellerId=1773&attachPdf=1
 * attachPdf=1: genereert het getekende contract-PDF en koppelt het aan de deal.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use GET or POST with ?sellerId=1773' });
  }

  const sellerId = (req.query.sellerId || (req.body && req.body.sellerId) || '').toString().trim();
  if (!sellerId) {
    return res.status(400).json({
      success: false,
      error: 'sellerId is verplicht. Voorbeeld: /api/admin/test-pipedrive-push?sellerId=1773',
    });
  }

  try {
    const packageSelection = await prisma.packageSelection.findFirst({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!packageSelection) {
      return res.status(404).json({
        success: false,
        error: `Geen PackageSelection gevonden met sellerId "${sellerId}".`,
      });
    }

    const attachPdf = req.query.attachPdf === '1' || req.query.attachPdf === 'true' || (req.body && (req.body.attachPdf === '1' || req.body.attachPdf === true));
    let pipedriveOptions;
    if (attachPdf) {
      try {
        const sellerEmail = (packageSelection.sellerEmail || '').trim() || '';
        const pdfBuffer = await generateAgreementPDF(packageSelection, packageSelection.sellerId, sellerEmail);
        pipedriveOptions = {
          pdfBuffer,
          pdfFilename: `SDeal_Agreement_${packageSelection.sellerId}_${packageSelection.id}.pdf`,
        };
      } catch (pdfErr) {
        console.warn('[test-pipedrive-push] PDF generation failed:', pdfErr.message);
      }
    }

    const result = await pushAanmeldingToPipedrive(packageSelection, pipedriveOptions);

    return res.status(200).json({
      success: result.success,
      message: result.success
        ? 'Aanmelding naar Pipedrive gestuurd (Organization + Person + Deal).'
        : (result.error || 'Pipedrive push mislukt'),
      sellerId,
      packageSelectionId: packageSelection.id,
      pipedrive: result.success
        ? { dealId: result.dealId, personId: result.personId, orgId: result.orgId }
        : { error: result.error },
    });
  } catch (err) {
    console.error('[test-pipedrive-push]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Onbekende fout bij pushen naar Pipedrive',
    });
  }
};
