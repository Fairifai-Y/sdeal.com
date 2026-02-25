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
const PIPEDRIVE_STAGE_OVK_GETEKEND = process.env.PIPEDRIVE_STAGE_OVK_GETEKEND;     // Deal stage \"OVK getekend\" (stage_id)
// Organization custom fields (keys uit /api/admin/test-pipedrive?organizationFields=1)
const PIPEDRIVE_ORG_FIELD_IBAN = process.env.PIPEDRIVE_ORG_FIELD_IBAN;             // IBAN
const PIPEDRIVE_ORG_FIELD_SWIFT = process.env.PIPEDRIVE_ORG_FIELD_SWIFT;           // BIC/SWIFT
const PIPEDRIVE_ORG_FIELD_KVK = process.env.PIPEDRIVE_ORG_FIELD_KVK;               // KVK/registratienummer
const PIPEDRIVE_ORG_FIELD_VAT = process.env.PIPEDRIVE_ORG_FIELD_VAT;               // BTW/VAT nummer
const PIPEDRIVE_ORG_FIELD_SELL_COUNTRIES = process.env.PIPEDRIVE_ORG_FIELD_SELL_COUNTRIES; // Verkoop in landen (set)
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
 * Upload a file (e.g. agreement PDF) to a Pipedrive deal.
 * @param {number} dealId - Deal ID
 * @param {Buffer|Uint8Array} fileBuffer - PDF bytes
 * @param {string} filename - Filename for the attachment
 * @returns {Promise<{ success: boolean, fileId?: number, error?: string }>}
 */
async function uploadFileToDeal(dealId, fileBuffer, filename = 'SDeal_Agreement.pdf') {
  const base = getBaseUrl();
  if (!base || !PIPEDRIVE_API_TOKEN) {
    return { success: false, error: 'Pipedrive not configured' };
  }
  const url = `${base.replace(/\/$/, '')}/files?api_token=${PIPEDRIVE_API_TOKEN}`;
  const body = new FormData();
  body.append('deal_id', String(dealId));
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  body.append('file', blob, filename);
  const res = await fetch(url, {
    method: 'POST',
    body,
  });
  const data = await res.json().catch(() => ({}));

  const apiSuccess = data && typeof data.success !== 'undefined' ? !!data.success : res.ok;
  const fileId = data && data.data && data.data.id;

  if (!apiSuccess || !fileId) {
    console.warn('[Pipedrive] File upload failed:', {
      httpStatus: res.status,
      apiSuccess: data.success,
      error: data.error || data.message,
      data,
    });
    return {
      success: false,
      error: data.error || data.message || `HTTP ${res.status}`,
    };
  }

  console.log('[Pipedrive] File attached to deal', dealId, 'fileId', fileId);
  return { success: true, fileId };
}

/**
 * Get a single file from Pipedrive by its ID (for debugging attachments).
 * @param {number|string} fileId
 * @returns {Promise<Object>}
 */
async function getPipedriveFile(fileId) {
  const base = getBaseUrl();
  if (!base || !PIPEDRIVE_API_TOKEN) {
    throw new Error('Pipedrive not configured: set PIPEDRIVE_API_TOKEN and PIPEDRIVE_DOMAIN or PIPEDRIVE_BASE_URL');
  }
  const url = `${base.replace(/\/$/, '')}/files/${fileId}?api_token=${PIPEDRIVE_API_TOKEN}`;
  const res = await fetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.error || data.message || `Pipedrive GET /files/${fileId} ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * List files attached to a specific deal.
 * @param {number|string} dealId
 * @returns {Promise<Object>}
 */
async function listPipedriveFilesForDeal(dealId) {
  const base = getBaseUrl();
  if (!base || !PIPEDRIVE_API_TOKEN) {
    throw new Error('Pipedrive not configured: set PIPEDRIVE_API_TOKEN and PIPEDRIVE_DOMAIN or PIPEDRIVE_BASE_URL');
  }
  const url = `${base.replace(/\/$/, '')}/files?api_token=${PIPEDRIVE_API_TOKEN}&deal_id=${encodeURIComponent(
    String(dealId),
  )}`;
  const res = await fetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.error || data.message || `Pipedrive GET /files ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Push one PackageSelection (aanmelding) to Pipedrive: create Organization (if company),
 * Person, and Deal. Optionally attach the signed agreement PDF to the deal.
 * @param {object} record - PackageSelection record (from Prisma)
 * @param {object} [options] - Optional: { pdfBuffer: Buffer|Uint8Array, pdfFilename: string }
 * @returns {{ success: boolean, dealId?: number, personId?: number, orgId?: number, error?: string }}
 */
async function pushAanmeldingToPipedrive(record, options = null) {
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
      if (PIPEDRIVE_ORG_FIELD_SELL_COUNTRIES && record.sellCountries != null) {
        let countries = [];
        if (Array.isArray(record.sellCountries)) {
          countries = record.sellCountries;
        } else if (typeof record.sellCountries === 'string') {
          try {
            const parsed = JSON.parse(record.sellCountries);
            if (Array.isArray(parsed)) countries = parsed;
          } catch (e) {
            // ignore
          }
        }
        const countryCodeToOptionId = { NL: 76, DE: 77, FR: 78, BE: 79, UK: 80, DK: 168, IT: 169, AT: 170 };
        const optionIds = (countries || [])
          .map((c) => String(c || '').toUpperCase())
          .map((code) => countryCodeToOptionId[code])
          .filter((id) => id != null);
        if (optionIds.length) {
          orgCustom[PIPEDRIVE_ORG_FIELD_SELL_COUNTRIES] = optionIds;
        }
      }
      const addressParts = [
        record.street && record.street.trim(),
        record.postalCode && record.postalCode.trim(),
        record.city && record.city.trim(),
        record.country && record.country.trim(),
      ].filter(Boolean);
      const address = addressParts.length ? addressParts.join(', ') : null;
      const orgBody = {
        name: companyName,
        ...(address ? { address } : {}),
        ...orgCustom,
      };
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
    // Dealwaarde: monthly = 12 × maandbedrag, yearly = jaarbedrag (zelfde als Admin.js package-prijzen)
    const packageMonthlyPrice = { A: 29, B: 49, C: 99 };
    const packageYearlyPrice = { A: 245, B: 415, C: 825 };
    const pkg = (record.package || '').toUpperCase();
    const billing = String(record.billingPeriod || '').toLowerCase();
    const monthlyAmount = packageMonthlyPrice[pkg];
    const yearlyAmount = packageYearlyPrice[pkg];
    let dealValue = null;
    if (billing === 'yearly' && yearlyAmount != null) {
      dealValue = yearlyAmount;
    } else if ((billing === 'monthly' || !billing) && monthlyAmount != null) {
      dealValue = 12 * monthlyAmount;
    }
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
      ...(PIPEDRIVE_STAGE_OVK_GETEKEND ? { stage_id: Number(PIPEDRIVE_STAGE_OVK_GETEKEND) } : {}),
      ...(dealValue != null ? { value: Number(dealValue), currency: 'EUR' } : {}),
      ...customFields,
    };
    const dealRes = await pipedriveRequest('POST', '/deals', dealBody);
    let dealId = null;
    if (dealRes && dealRes.data && dealRes.data.id) {
      dealId = dealRes.data.id;
    } else {
      return { success: false, error: 'Failed to create Pipedrive deal', personId, dealRes };
    }

    if (dealId && options && options.pdfBuffer) {
      const filename = options.pdfFilename || `SDeal_Agreement_${record.sellerId || record.id}.pdf`;
      const uploadResult = await uploadFileToDeal(dealId, options.pdfBuffer, filename);
      if (!uploadResult.success) {
        console.warn('[Pipedrive] Could not attach agreement PDF:', uploadResult.error);
      }
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
  getPipedriveFile,
  listPipedriveFilesForDeal,
};
