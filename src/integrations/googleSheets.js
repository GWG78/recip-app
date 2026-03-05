import { env } from '../env.js';

function getConfig(url) {
  const missing = [];
  if (!url) missing.push('Google Sheets URL');
  if (!env.googleSheets.apiKey) missing.push('Google Sheets API key');

  if (missing.length) {
    console.warn(`⚠️ Sheets sync skipped: missing ${missing.join(' and ')}`);
    return null;
  }

  return {
    url: `${url}?api_key=${env.googleSheets.apiKey}`,
  };
}

async function postToSheets(url, payload) {
  const config = getConfig(url);
  if (!config) return false;

  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} - ${body}`);
  }

  return true;
}

export async function sendInstallLead({ shopDomain }) {
  try {
    await postToSheets(env.googleSheets.installsUrl, {
      sheetName: env.googleSheets.installsSheetName,
      shopDomain,
      installedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Install Sheets sync failed:', err.message);
  }
}
