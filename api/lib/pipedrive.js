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
// Custom deal field keys (40-char hash per veld; haal op via GET /api/admin/test-pipedrive?dealFields=1)
const PIPEDRIVE_FIELD_MAGENTO_DEAL_ID = process.env.PIPEDRIVE_FIELD_MAGENTO_DEAL_ID || process.env.PIPEDRIVE_MAGENTO_DEAL_ID_FIELD_KEY;
const PIPEDRIVE_FIELD_MARGEAFSPRAAK = process.env.PIPEDRIVE_FIELD_MARGEAFSPRAAK;   // commissie
const PIPEDRIVE_FIELD_PACKAGE = process.env.PIPEDRIVE_FIELD_PACKAGE;               // Package A/B/C
const PIPEDRIVE_FIELD_PAYMENT = process.env.PIPEDRIVE_FIELD_PAYMENT;               // Monthly/Yearly
// Organization custom fields (keys uit /api/admin/test-pipedrive?organizationFields=1)
const PIPEDRIVE_ORG_FIELD_IBAN = process.env.PIPEDRIVE_ORG_FIELD_IBAN;             // IBAN
const PIPEDRIVE_ORG_FIELD_SWIFT = process.env.PIPEDRIVE_ORG_FIELD_SWIFT;           // BIC/SWIFT
const PIPEDRIVE_ORG_FIELD_KVK = process.env.PIPEDRIVE_ORG_FIELD_KVK;               // KVK/registratienummer
const PIPEDRIVE_ORG_FIELD_VAT = process.env.PIPEDRIVE_ORG_FIELD_VAT;               // BTW/VAT nummer
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
      const orgCustom = {};
      if (PIPEDRIVE_ORG_FIELD_KVK && (record.kvkNumber != null && record.kvkNumber !== '')) {
        orgCustom[PIPEDRIVE_ORG_FIELD_KVK] = String(record.kvkNumber).trim();
      }
      if (PIPEDRIVE_ORG_FIELD_VAT && (record.vatNumber != null && record.vatNumber !== '')) {
        orgCustom[PIPEDRIVE_ORG_FIELD_VAT] = String(record.vatNumber).trim();
      }
      if (PIPEDRIVE_ORG_FIELD_IBAN && (record.iban != null && record.iban !== '')) {
        orgCustom[PIPEDRIVE_ORG_FIELD_IBAN] = String(record.iban).trim();
      }
      if (PIPEDRIVE_ORG_FIELD_SWIFT && (record.bic != null && record.bic !== '')) {
        orgCustom[PIPEDRIVE_ORG_FIELD_SWIFT] = String(record.bic).trim();
      }
      const orgBody = { name: companyName, ...orgCustom };
      const orgRes = await pipedriveRequest('POST', '/organizations', orgBody);
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
    // Pipedrive enum velden vereisen optie-ID (uit dealFields). IDs uit jullie Pipedrive:
    const packageOptionId = { A: 197, B: 198, C: 199 };  // Package A/B/C
    const paymentOptionId = { monthly: 204, yearly: 205 }; // Monthly / Yearly
    const margeafspraakLabelToId = { 5: 139, 6: 140, 7: 141, 8: 142, 9: 143, 10: 144, 11: 145, 12: 146, '12.4': 88, 13: 147, 14: 90, 15: 34, 16: 148, '16.7': 89, 17: 149, 18: 150, 19: 151, 20: 35, 25: 36, 30: 152, 40: 153, 50: 154 };
    const customFields = {};
    if (PIPEDRIVE_FIELD_MAGENTO_DEAL_ID && record.sellerId && !String(record.sellerId).startsWith('NEW-')) {
      customFields[PIPEDRIVE_FIELD_MAGENTO_DEAL_ID] = String(record.sellerId);
    }
    if (PIPEDRIVE_FIELD_MARGEAFSPRAAK && record.commissionPercentage != null && record.commissionPercentage !== '') {
      const commission = Number(record.commissionPercentage);
      const id = margeafspraakLabelToId[commission] ?? margeafspraakLabelToId[String(commission)];
      if (id != null) customFields[PIPEDRIVE_FIELD_MARGEAFSPRAAK] = id;
    }
    if (PIPEDRIVE_FIELD_PACKAGE && record.package) {
      const id = packageOptionId[record.package.toUpperCase()];
      if (id != null) customFields[PIPEDRIVE_FIELD_PACKAGE] = id;
    }
    if (PIPEDRIVE_FIELD_PAYMENT && record.billingPeriod) {
      const key = String(record.billingPeriod).toLowerCase();
      const id = paymentOptionId[key];
      if (id != null) customFields[PIPEDRIVE_FIELD_PAYMENT] = id;
    }
    const dealBody = {
      title: dealTitle,
      person_id: personId,
      ...(orgId ? { org_id: orgId } : {}),
      ...customFields,
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
