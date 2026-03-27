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

export async function sendReferralEventRow({
  event_id,
  event_type,
  timestamp,
  from_shop_domain,
  to_shop_domain,
  offer_id,
  discount_code,
  discount_code_id,
  discount_state,
  order_id,
  order_number,
  order_currency,
  order_total,
  line_item_count,
  user_agent,
  referer,
  environment,
}) {
  try {
    await postToSheets(
      env.googleSheets.referralEventsUrl,
      {
        sheetName: env.googleSheets.referralEventsSheetName,
        event_id,
        event_type,
        timestamp,
        from_shop_domain: from_shop_domain || null,
        to_shop_domain: to_shop_domain || null,
        offer_id: offer_id || null,
        discount_code: discount_code || null,
        discount_code_id: discount_code_id || null,
        discount_state: discount_state || null,
        order_id: order_id || null,
        order_number: order_number || null,
        order_currency: order_currency || null,
        order_total: order_total || null,
        line_item_count: line_item_count || null,
        user_agent: user_agent || null,
        referer: referer || null,
        environment: environment || null,
      }
    );
  } catch (err) {
    console.error('❌ ReferralEvents Sheets sync failed:', err.message);
  }
}
