// src/auth/shopifyAuth.js
import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../env.js';
import { prisma } from '../db.js';

const router = Router();

/**
 * Step 1: Redirect merchant to Shopify OAuth
 */
router.get('/install', async (req, res) => {
  const { shop } = req.query;

  if (!shop || !shop.endsWith('.myshopify.com')) {
    return res.status(400).send('Invalid shop parameter');
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${env.appUrl}/auth/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${env.shopify.apiKey}` +
    `&scope=${env.shopify.scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  res.redirect(installUrl);
});

/**
 * Helper: register a webhook and LOG RESULT
 */
async function registerWebhook({ shop, accessToken, topic, callbackUrl }) {
  const response = await fetch(
    `https://${shop}/admin/api/2026-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: `
          mutation webhookCreate($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
            webhookSubscriptionCreate(
              topic: $topic
              webhookSubscription: {
                callbackUrl: $callbackUrl
                format: JSON
              }
            ) {
              webhookSubscription { id }
              userErrors { field message }
            }
          }
        `,
        variables: { topic, callbackUrl },
      }),
    }
  );

  const data = await response.json();
  console.log(
    `🔔 Webhook ${topic} registration result:\n`,
    JSON.stringify(data, null, 2)
  );
}

/**
 * Step 2: OAuth callback
 */
router.get('/callback', async (req, res) => {
    console.log('🚨 OAUTH CALLBACK HIT', req.query);
  const { shop, code } = req.query;


  if (!shop || !code) {
    return res.status(400).send('Missing shop or code');
  }

  const tokenResponse = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.shopify.apiKey,
        client_secret: env.shopify.apiSecret,
        code,
      }),
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error('OAuth error:', tokenData);
    return res.status(500).send('OAuth failed');
  }

  const accessToken = tokenData.access_token;
  const scope = tokenData.scope;

  // 🔐 Persist shop (reinstall-safe)
  await prisma.shop.upsert({
    where: { shopDomain: shop },
    update: {
      accessToken,
      scope,
      installed: true,
      uninstalledAt: null,
    },
    create: {
      shopDomain: shop,
      accessToken,
      scope,
      installed: true,
    },
  });

  // 🔔 REGISTER WEBHOOKS (single, explicit place)
  await registerWebhook({
    shop,
    accessToken,
    topic: 'APP_UNINSTALLED',
    callbackUrl: `${env.appUrl}/webhooks/app_uninstalled`,
  });

  await registerWebhook({
    shop,
    accessToken,
    topic: 'ORDERS_CREATE',
    callbackUrl: `${env.appUrl}/webhooks/orders_create`,
  });

  // 🚀 Redirect into Shopify Admin
  res.redirect(`https://${shop}/admin/apps/${env.shopify.apiKey}`);
});

export default router;