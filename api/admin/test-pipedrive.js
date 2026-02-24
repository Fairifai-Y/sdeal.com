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

    return res.json({
      success: true,
      message: 'Pipedrive-verbinding OK',
      baseUrl,
      user: data.data || null,
    });
  } catch (error) {
    console.error('[Admin test-pipedrive]', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Onbekende fout bij testen Pipedrive-verbinding',
    });
  }
};

