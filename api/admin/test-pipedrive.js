const { getBaseUrl } = require('../lib/pipedrive');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
  }

  try {
    const baseUrl = getBaseUrl();
    const token = process.env.PIPEDRIVE_API_TOKEN;
    const includeDealFields = req.query.dealFields === '1' || req.query.dealFields === 'true';
    const includeOrgFields = req.query.organizationFields === '1' || req.query.organizationFields === 'true';

    if (!baseUrl || !token) {
      return res.status(400).json({
        success: false,
        error: 'Pipedrive is niet geconfigureerd. Controleer PIPEDRIVE_API_TOKEN en PIPEDRIVE_DOMAIN/PIPEDRIVE_BASE_URL.',
      });
    }

    const url = `${baseUrl.replace(/\/$/, '')}/users/me?api_token=${token}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error || data.message || `Pipedrive error ${response.status}`,
        details: data,
      });
    }

    const result = {
      success: true,
      message: 'Pipedrive-verbinding OK',
      baseUrl,
      user: data.data || null,
    };

    if (includeDealFields) {
      const fieldsUrl = `${baseUrl.replace(/\/$/, '')}/dealFields?api_token=${token}`;
      const fieldsRes = await fetch(fieldsUrl);
      const fieldsData = await fieldsRes.json().catch(() => ({}));
      if (fieldsRes.ok && fieldsData.data) {
        result.dealFields = fieldsData.data.map((f) => ({
          name: f.name,
          key: f.key,
          field_type: f.field_type,
          options: f.options ? f.options.map((o) => ({ id: o.id, label: o.label })) : undefined,
        }));
      } else {
        result.dealFieldsError = fieldsData.error || 'Kon dealFields niet ophalen';
      }
    }
    if (includeOrgFields) {
      const orgFieldsUrl = `${baseUrl.replace(/\/$/, '')}/organizationFields?api_token=${token}`;
      const orgFieldsRes = await fetch(orgFieldsUrl);
      const orgFieldsData = await orgFieldsRes.json().catch(() => ({}));
      if (orgFieldsRes.ok && orgFieldsData.data) {
        result.organizationFields = orgFieldsData.data.map((f) => ({
          name: f.name,
          key: f.key,
          field_type: f.field_type,
          options: f.options ? f.options.map((o) => ({ id: o.id, label: o.label })) : undefined,
        }));
      } else {
        result.organizationFieldsError = orgFieldsData.error || 'Kon organizationFields niet ophalen';
      }
    }
    if (!result.hint) {
      result.hint = 'Voeg ?dealFields=1 en/of ?organizationFields=1 toe om Deal- of Organisatie-velden (name + key) op te halen.';
    }

    return res.json(result);
  } catch (error) {
    console.error('[Admin test-pipedrive]', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Onbekende fout bij testen Pipedrive-verbinding',
    });
  }
};

