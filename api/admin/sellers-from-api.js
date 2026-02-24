/**
 * GET /api/admin/sellers-from-api
 * Admin only. Returns list of sellers from the SDeal Seller Admin API:
 * GET /rest/V1/supplier/list/ (see API doc §8).
 * Each item has id, name, is_active (1=enabled, 0=disabled), status, commission, created_at, etc.
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
    const includePackages = req.query.includePackages === '1' || req.query.includePackages === 'true';
    const pageSize = 500;
    const allItems = [];
    let page = 1;
    let hasMore = true;
    const dateFrom = '2010-01-01 00:00:00';
    const dateTo = '2030-12-31 23:59:59';

    while (hasMore) {
      const params = {
        'searchCriteria[filter_groups][0][filters][0][field]': 'created_at',
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'from',
        'searchCriteria[filter_groups][0][filters][0][value]': dateFrom,
        'searchCriteria[filter_groups][1][filters][0][field]': 'created_at',
        'searchCriteria[filter_groups][1][filters][0][condition_type]': 'to',
        'searchCriteria[filter_groups][1][filters][0][value]': dateTo,
        'searchCriteria[pageSize]': pageSize,
        'searchCriteria[currentPage]': page,
      };
      const data = await makeRequest('/supplier/list/', params);
      const items = data?.items || [];
      allItems.push(...items);
      const totalCount = data?.total_count ?? data?.totalCount ?? 0;
      if (items.length < pageSize || page * pageSize >= totalCount) {
        hasMore = false;
      } else {
        page += 1;
        if (page > 100) hasMore = false;
      }
    }

    const sellers = allItems.map((item) => ({
      supplier_id: item.id != null ? String(item.id) : null,
      supplier_name: item.name || null,
      is_active: item.is_active,
      status: item.status,
      commission: item.commission,
      created_at: item.created_at,
      updated_at: item.updated_at,
      url_key: item.url_key,
      official_seller: item.official_seller,
    })).filter((s) => s.supplier_id).sort((a, b) => {
      const na = Number(a.supplier_id);
      const nb = Number(b.supplier_id);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return String(a.supplier_id).localeCompare(String(b.supplier_id));
    });

    if (includePackages && sellers.length > 0) {
      const maxWithPackages = Math.min(sellers.length, 80);
      const batchSize = 10;
      const delayMs = 150;
      const viewBySupplier = {};
      const slice = sellers.slice(0, maxWithPackages);
      for (let i = 0; i < slice.length; i += batchSize) {
        const batch = slice.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map((s) =>
            makeRequest(`/supplier/view/${s.supplier_id}`).then((viewData) => ({ supplier_id: String(s.supplier_id), view: viewData }))
          )
        );
        batchResults.forEach((res) => {
          if (res.status === 'fulfilled' && res.value && res.value.view) {
            const v = res.value.view;
            let first = null;
            if (Array.isArray(v) && v.length > 0) first = v[0];
            else if (v && Array.isArray(v.items) && v.items.length > 0) first = v.items[0];
            else if (v && Array.isArray(v.data) && v.data.length > 0) first = v.data[0];
            else if (v && typeof v === 'object' && !Array.isArray(v)) first = v;
            if (first) {
              const packages = first.packages || first.package || [];
              const list = Array.isArray(packages) ? packages : [packages];
              if (list.length > 0) {
                viewBySupplier[res.value.supplier_id] = list.filter(Boolean);
              }
            }
          }
        });
        if (i + batchSize < slice.length) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      sellers.forEach((s) => {
        const key = String(s.supplier_id);
        s.packages = viewBySupplier[key] || [];
      });
    }

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
