type SheetsPayload = Record<string, unknown>;

function buildSheetsUrl(baseUrl: string | undefined, apiKey: string | undefined) {
  const missing: string[] = [];
  if (!baseUrl) missing.push("Google Sheets URL");
  if (!apiKey) missing.push("Google Sheets API key");

  if (missing.length) {
    console.warn(`⚠️ Sheets sync skipped: missing ${missing.join(" and ")}`);
    return null;
  }

  return `${baseUrl}?api_key=${apiKey}`;
}

async function postToSheets(baseUrl: string | undefined, payload: SheetsPayload) {
  const endpoint = buildSheetsUrl(baseUrl, process.env.GOOGLE_SHEETS_API_KEY);
  if (!endpoint) return false;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} - ${body}`);
  }

  return true;
}

export async function sendFriendlyBrandLead(args: {
  fromShopDomain: string;
  fromShopName?: string;
  enteredBrandDomain: string;
}) {
  try {
    await postToSheets(process.env.GOOGLE_SHEETS_FRIENDLY_BRANDS_URL, {
      sheetName: process.env.FRIENDLY_BRANDS_SHEET_NAME || "FriendlyBrandLeads",
      fromShopDomain: args.fromShopDomain,
      fromShopName: args.fromShopName || args.fromShopDomain,
      enteredBrandDomain: args.enteredBrandDomain,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Friendly-brand Sheets sync failed:", message);
  }
}

export async function sendInstallLead(args: { shopDomain: string }) {
  try {
    await postToSheets(
      process.env.GOOGLE_SHEETS_INSTALLS_URL ||
        process.env.GOOGLE_SHEETS_FRIENDLY_BRANDS_URL,
      {
        sheetName: process.env.INSTALLS_SHEET_NAME || "Installs",
        shopDomain: args.shopDomain,
        installedAt: new Date().toISOString(),
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Install Sheets sync failed:", message);
  }
}
