// src/webhooks/index.js
import { Router } from 'express';
import { verifyShopifyWebhook } from './verifyWebhook.js';
import { prisma } from '../db.js';

const router = Router();

/**
 * APP UNINSTALLED
 */
router.post('/app_uninstalled', async (req, res) => {
    console.log('🔥 app_uninstalled webhook received');

  if (!verifyShopifyWebhook(req)) {
    return res.status(401).send('Invalid webhook');
  }
  console.log('✅ webhook verified');

  const payload = JSON.parse(req.body.toString());
  const shopDomain = payload.myshopify_domain;

  await prisma.shop.updateMany({
    where: { shopDomain },
    data: {
      installed: false,
      active: false,
      accessToken: null,
      uninstalledAt: new Date(),
    },
  });

  res.status(200).send('OK');
});

/**
 * ORDERS CREATE
 */
router.post('/orders_create', async (req, res) => {
    console.log('🔥 orders_create webhook received');
  if (!verifyShopifyWebhook(req)) {
    return res.status(401).send('Invalid webhook');
  }

  const order = JSON.parse(req.body.toString());
  const shopDomain = req.headers['x-shopify-shop-domain'];

  // Idempotency guard
  const existing = await prisma.commissionLedger.findUnique({
    where: { orderId: String(order.id) },
  });

  if (existing) {
    return res.status(200).send('Already processed');
  }

  const discountCodes = order.discount_codes || [];
  if (!discountCodes.length) {
    return res.status(200).send('No discount');
  }

  const code = discountCodes[0].code;

  const discount = await prisma.discountCode.findUnique({
    where: { code },
    include: { toShop: { include: { settings: true } } },
  });

  if (!discount) {
    return res.status(200).send('Not a Recip code');
  }

  const commissionRate = discount.toShop.settings.commissionRate;
  const orderAmount = Number(order.total_price);

  await prisma.discountCode.update({
    where: { id: discount.id },
    data: {
      state: 'REDEEMED',
      redeemedAt: new Date(),
      orderId: String(order.id),
      orderAmount,
      lineItemCount: order.line_items.length,
    },
  });

  await prisma.commissionLedger.create({
    data: {
      shopId: discount.toShopId,
      orderId: String(order.id),
      orderAmount,
      commissionRate,
      commissionAmount: orderAmount * Number(commissionRate),
      periodMonth: new Date().toISOString().slice(0, 7),
    },
  });

  res.status(200).send('OK');
});

export default router;