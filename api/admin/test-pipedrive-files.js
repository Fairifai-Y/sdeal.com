const { getPipedriveFile, listPipedriveFilesForDeal } = require('../lib/pipedrive');

/**
 * Test/debug endpoint: inspect files in Pipedrive.
 *
 * Examples:
 *  - /api/admin/test-pipedrive-files?fileId=258835
 *  - /api/admin/test-pipedrive-files?dealId=3592
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, error: 'Use GET with ?fileId=123 or ?dealId=456' });
  }

  const fileId = (req.query.fileId || '').toString().trim();
  const dealId = (req.query.dealId || '').toString().trim();

  if (!fileId && !dealId) {
    return res.status(400).json({
      success: false,
      error: 'Geef ?fileId=123 of ?dealId=456 mee.',
    });
  }

  try {
    if (fileId) {
      const data = await getPipedriveFile(fileId);
      return res.status(200).json({
        success: true,
        mode: 'fileId',
        fileId,
        raw: data,
      });
    }

    const data = await listPipedriveFilesForDeal(dealId);
    return res.status(200).json({
      success: true,
      mode: 'dealId',
      dealId,
      raw: data,
    });
  } catch (err) {
    console.error('[test-pipedrive-files]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Onbekende fout bij ophalen Pipedrive files',
      details: err.data || null,
    });
  }
};

