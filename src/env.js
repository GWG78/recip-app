// src/env.js
import 'dotenv/config';

export const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  appUrl: process.env.APP_URL,

  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES,
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
  },

  googleSheets: {
    friendlyBrandsUrl: process.env.GOOGLE_SHEETS_FRIENDLY_BRANDS_URL,
    installsUrl:
      process.env.GOOGLE_SHEETS_INSTALLS_URL ||
      process.env.GOOGLE_SHEETS_FRIENDLY_BRANDS_URL,
    apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    friendlyBrandsSheetName:
      process.env.FRIENDLY_BRANDS_SHEET_NAME || 'FriendlyBrandLeads',
    installsSheetName: process.env.INSTALLS_SHEET_NAME || 'Installs',
  },
};
