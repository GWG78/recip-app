// src/webhooks/verifyWebhook.js
import crypto from 'crypto';
import { env } from '../env.js';

export function verifyShopifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  if (!hmac) return false;

  const digest = crypto
    .createHmac('sha256', env.shopify.webhookSecret)
    .update(req.body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(digest)
  );
}