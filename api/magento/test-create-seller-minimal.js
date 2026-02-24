const { makePostRequest } = require('../seller-admin/helpers');

/**
 * Test: maak een seller (supplier) in Magento met alleen naam + is_active.
 *
 * GET of POST:
 *   /api/magento/test-create-seller-minimal?name=Test%20seller&active=1
 *
 * Default: name = 'SDeal minimal test seller', active = 1.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use GET or POST.' });
  }

  const name =
    (req.query.name ||
      (req.body && req.body.name) ||
      'SDeal minimal test seller').toString().trim();
  const activeParam =
    (req.query.active || (req.body && req.body.active) || '1').toString().trim();
  const isActive = activeParam === '1' || activeParam.toLowerCase() === 'true';

  try {
    const body = {
      name,
      is_active: isActive ? 1 : 0,
    };

    const response = await makePostRequest('/supplier/create', body);

    return res.status(200).json({
      success: true,
      message: 'Minimal seller create request sent to Magento.',
      requestBody: body,
      rawResponse: response,
    });
  } catch (err) {
    console.error('[Magento test-create-seller-minimal]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Onbekende fout bij aanmaken seller in Magento',
      details: err.details,
    });
  }
};

