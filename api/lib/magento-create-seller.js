/**
 * Create a seller (supplier) in Magento via Seller Admin API: POST /supplier/create
 * Used after successful payment for new customers (sellerId was placeholder NEW-xxx).
 *
 * Env: SELLER_ADMIN_ACCESS_TOKEN, SELLER_ADMIN_API_BASE_URL (or PROXY_BASE_URL)
 */

const { makePostRequest } = require('../seller-admin/helpers');

/**
 * Create supplier in Magento. Returns the new supplier_id (string or number).
 * @param {object} record - PackageSelection record (companyName, firstName, lastName, commissionPercentage, package, billingPeriod, sellCountries, sellerEmail, etc.)
 * @returns {{ success: boolean, supplier_id?: string, error?: string }}
 */
async function createSellerInMagento(record) {
  if (!record) {
    return { success: false, error: 'No record' };
  }
  const name = [record.companyName, [record.firstName, record.lastName].filter(Boolean).join(' ')].filter(Boolean)[0]
    || (record.sellerEmail || '').trim()
    || 'SDeal seller';
  const commission = record.commissionPercentage != null
    ? String(Number(record.commissionPercentage))
    : record.package === 'A'
      ? '12'
      : '4';
  const parts = [
    record.package && `Pakket ${record.package}`,
    record.billingPeriod && (record.billingPeriod === 'yearly' ? 'Jaarlijks' : 'Maandelijks'),
    record.sellCountries && Array.isArray(record.sellCountries) && record.sellCountries.length
      ? `Landen: ${record.sellCountries.join(', ')}`
      : null,
    record.sellerEmail ? `Email: ${record.sellerEmail}` : null,
  ].filter(Boolean);
  const description = parts.length ? parts.join(' | ') : 'Aanmelding via SDeal aanmeldstraat';

  try {
    const body = { name, commission, description };
    const response = await makePostRequest('/supplier/create', body);
    // API returns e.g. "2338" (string) or possibly { data: "2338" }
    const rawId = typeof response === 'string' ? response : (response && (response.data ?? response.id ?? response.supplier_id));
    const supplierId = rawId != null ? String(rawId).trim() : null;
    if (!supplierId) {
      return { success: false, error: 'Magento returned no supplier_id', response };
    }
    console.log('[Magento create seller] Created supplier_id:', supplierId);
    return { success: true, supplier_id: supplierId };
  } catch (err) {
    console.error('[Magento create seller] Error:', err.message);
    return { success: false, error: err.message, details: err.details };
  }
}

module.exports = { createSellerInMagento };
