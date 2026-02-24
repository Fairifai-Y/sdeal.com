/**
 * Kleine helper om de Pipedrive-verbinding lokaal te testen.
 *
 * Gebruik:
 *   - Zorg dat PIPEDRIVE_API_TOKEN en PIPEDRIVE_DOMAIN of PIPEDRIVE_BASE_URL
 *     in je omgeving staan (of laad je .env met bv. `node -r dotenv/config scripts/test-pipedrive-connection.js`)
 *   - Run:
 *       node scripts/test-pipedrive-connection.js
 */

// Probeer optioneel dotenv te laden als het geïnstalleerd is
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  require('dotenv').config();
} catch (e) {
  // Geen probleem als dotenv niet bestaat; dan moeten env-vars al gezet zijn
}

const { getBaseUrl } = require('../api/lib/pipedrive');

async function main() {
  const baseUrl = getBaseUrl();
  const token = process.env.PIPEDRIVE_API_TOKEN;

  if (!baseUrl || !token) {
    console.error('❌ Pipedrive niet geconfigureerd.');
    console.error('   Controleer PIPEDRIVE_API_TOKEN en PIPEDRIVE_DOMAIN of PIPEDRIVE_BASE_URL in je .env / omgeving.');
    process.exit(1);
  }

  const url = `${baseUrl.replace(/\/$/, '')}/users/me?api_token=${token}`;
  console.log('🔎 Test Pipedrive-verbinding...');
  console.log('   Base URL:', baseUrl);

  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('❌ Pipedrive error:', res.status, data.error || data.message || '');
      process.exit(1);
    }

    console.log('✅ Pipedrive-verbinding OK');
    if (data && data.data) {
      console.log('   Ingelogde user:', data.data.name || data.data.email || data.data.id);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Fout bij verbinden met Pipedrive:', err.message);
    process.exit(1);
  }
}

main();

