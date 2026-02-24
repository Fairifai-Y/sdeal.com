/**
 * GET /api/admin/seller-view?supplierId=1773
 * Admin only. Returns supplier details from SDeal API: GET /supplier/view/{id}
 * (supplier, addresses, contacts, packages).
 */

const { requireAuth } = require('./auth');
const { makeRequest } = require('../seller-admin/helpers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed.' });

  if (!(await requireAuth(req, res))) return;

  const supplierId = req.query.supplierId || req.query.id;
  if (!supplierId) {
    return res.status(400).json({ success: false, error: 'supplierId required' });
  }

  try {
    const data = await makeRequest(`/supplier/view/${supplierId}`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin seller-view]', error);
    res.status(error.status === 404 ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch supplier view',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
