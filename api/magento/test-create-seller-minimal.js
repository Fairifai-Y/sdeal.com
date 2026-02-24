const { makePostRequest } = require('../seller-admin/helpers');

/**
 * Test: maak een seller (supplier) in Magento met minimaal dezelfde body als de officiële API:
 *   { \"name\", \"commission\", \"description\" }.
 *
 * GET of POST:
 *   /api/magento/test-create-seller-minimal?name=Test%20seller&commission=21.0&description=Test
 *
 * Defaults:
 *   name        = 'SDeal minimal test seller'
 *   commission  = '21.0'
 *   description = 'Testapi description'
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
  const commission =
    (req.query.commission ||
      (req.body && req.body.commission) ||
      '21.0').toString().trim();
  const description =
    (req.query.description ||
      (req.body && req.body.description) ||
      'Testapi description').toString().trim();

  try {
    const body = {
      name,
      commission,
      description,
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

