/**
 * GET /api/admin/sellers-from-api
 * Admin only. Returns list of sellers (suppliers) from the SDeal/Magento API
 * by fetching balance records (balance/search without supplier filter) and deduplicating by supplier_id.
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

  try {
    const pageSize = 1000;
    const seen = new Map(); // supplier_id -> { supplier_id, supplier_name }
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await makeRequest('/sportdeal-balancemanagement/balance/search/', {
        'searchCriteria[pageSize]': pageSize,
        'searchCriteria[currentPage]': page,
      });

      const items = data?.items || [];
      items.forEach((item) => {
        const sid = item.supplier_id != null ? String(item.supplier_id) : null;
        if (sid && !seen.has(sid)) {
          seen.set(sid, {
            supplier_id: sid,
            supplier_name: item.supplier_name || null,
          });
        }
      });

      const totalCount = data?.total_count ?? data?.totalCount ?? 0;
      if (items.length < pageSize || page * pageSize >= totalCount) {
        hasMore = false;
      } else {
        page += 1;
        if (page > 50) hasMore = false; // safety limit
      }
    }

    const sellers = Array.from(seen.values()).sort((a, b) => {
      const na = Number(a.supplier_id);
      const nb = Number(b.supplier_id);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return String(a.supplier_id).localeCompare(String(b.supplier_id));
    });

    res.json({
      success: true,
      data: {
        sellers,
        total: sellers.length,
      },
    });
  } catch (error) {
    console.error('[Admin sellers-from-api]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sellers from API',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
