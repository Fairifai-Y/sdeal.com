/**
 * Pipedrive integration: push SDeal aanmeldingen (PackageSelection) to Pipedrive
 * as Person + optional Organization + Deal.
 *
 * Environment:
 *   PIPEDRIVE_API_TOKEN  - API token (required)
 *   PIPEDRIVE_DOMAIN     - Company domain, e.g. "sdeal" for sdeal.pipedrive.com (optional; can use PIPEDRIVE_BASE_URL)
 *   PIPEDRIVE_BASE_URL   - Full base URL, e.g. https://sdeal.pipedrive.com/api/v1 (optional; overrides domain)
 */

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_DOMAIN = (process.env.PIPEDRIVE_DOMAIN || '').replace(/\.pipedrive\.com$/i, '');
const PIPEDRIVE_BASE_URL = process.env.PIPEDRIVE_BASE_URL ||
  (PIPEDRIVE_DOMAIN ? `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1` : null);

function getBaseUrl() {
  if (PIPEDRIVE_BASE_URL) return PIPEDRIVE_BASE_URL.replace(/\/$/, '');
  if (PIPEDRIVE_DOMAIN) return `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`;
  return null;
}

async function pipedriveRequest(method, path, body = null) {
  const base = getBaseUrl();
  if (!base || !PIPEDRIVE_API_TOKEN) {
    throw new Error('Pipedrive not configured: set PIPEDRIVE_API_TOKEN and PIPEDRIVE_DOMAIN or PIPEDRIVE_BASE_URL');
  }
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}?api_token=${PIPEDRIVE_API_TOKEN}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Pipedrive ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Push one PackageSelection (aanmelding) to Pipedrive: create Organization (if company),
 * Person, and Deal.
 * @param {object} record - PackageSelection record (from Prisma)
 * @returns {{ success: boolean, dealId?: number, personId?: number, orgId?: number, error?: string }}
 */
async function pushAanmeldingToPipedrive(record) {
  if (!record) {
    return { success: false, error: 'No record' };
  }
  const base = getBaseUrl();
  if (!base || !PIPEDRIVE_API_TOKEN) {
    console.warn('[Pipedrive] Skipped: PIPEDRIVE_API_TOKEN or PIPEDRIVE_BASE_URL/PIPEDRIVE_DOMAIN not set');
    return { success: false, error: 'Pipedrive not configured' };
  }

  try {
    const email = (record.sellerEmail || '').trim() || null;
    const companyName = (record.companyName || '').trim() || null;
    const firstName = (record.firstName || '').trim() || null;
    const lastName = (record.lastName || '').trim() || null;
    const phone = (record.phone || '').trim() || null;
    const name = [firstName, lastName].filter(Boolean).join(' ') || companyName || email || 'SDeal aanmelding';

    let orgId = null;
    if (companyName) {
      const orgRes = await pipedriveRequest('POST', '/organizations', { name: companyName });
      if (orgRes && orgRes.data && orgRes.data.id) {
        orgId = orgRes.data.id;
      }
    }

    const personBody = {
      name,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(orgId ? { org_id: orgId } : {}),
    };
    const personRes = await pipedriveRequest('POST', '/persons', personBody);
    let personId = null;
    if (personRes && personRes.data && personRes.data.id) {
      personId = personRes.data.id;
    } else {
      return { success: false, error: 'Failed to create Pipedrive person', personRes };
    }

    const dealTitle = companyName
      ? `${companyName} deal`
      : `${name} deal`;
    const dealBody = {
      title: dealTitle,
      person_id: personId,
      ...(orgId ? { org_id: orgId } : {}),
    };
    const dealRes = await pipedriveRequest('POST', '/deals', dealBody);
    let dealId = null;
    if (dealRes && dealRes.data && dealRes.data.id) {
      dealId = dealRes.data.id;
    } else {
      return { success: false, error: 'Failed to create Pipedrive deal', personId, dealRes };
    }

    console.log('[Pipedrive] Created deal', dealId, 'person', personId, orgId ? `org ${orgId}` : '');
    return { success: true, dealId, personId, orgId: orgId || undefined };
  } catch (err) {
    console.error('[Pipedrive] Error:', err.message, err.data || '');
    return { success: false, error: err.message, details: err.data };
  }
}

module.exports = {
  pushAanmeldingToPipedrive,
  getBaseUrl,
};
