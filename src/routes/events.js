import { Router } from 'express';
import { prisma } from '../db.js';
import { sendReferralEventRow } from '../integrations/googleSheets.js';

const router = Router();

/**
 * POST /events/impression
 * Records a brand impression on the thank-you page
 */
router.post('/impression', async (req, res) => {
  const shopDomain = req.headers['x-shopify-shop-domain'];
  const {
    orderId,
    offerBrandDomain,
    lineItemCount,
    position,
  } = req.body;

  if (!shopDomain || !orderId || !offerBrandDomain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const toShop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!toShop) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  const fromShop = await prisma.shop.findFirst({
    where: { shopDomain: offerBrandDomain },
  });

  // Brand may not exist yet — that's OK
  if (!fromShop) {
    return res.status(200).json({ skipped: true });
  }

  /**
   * Idempotency:
   * one impression per (orderId + fromShop + toShop)
   */
  const existing = await prisma.referralEvent.findFirst({
    where: {
      type: 'IMPRESSION',
      fromShopId: fromShop.id,
      toShopId: toShop.id,
      meta: {
        path: ['orderId'],
        equals: orderId,
      },
    },
  });

  if (existing) {
    return res.status(200).json({ ok: true, deduped: true });
  }

  const event = await prisma.referralEvent.create({
    data: {
      type: 'IMPRESSION',
      fromShopId: fromShop.id,
      toShopId: toShop.id,
      meta: {
        orderId,
        offerBrandDomain,
        lineItemCount,
        position,
      },
    },
    include: {
      fromShop: { select: { shopDomain: true } },
      toShop: { select: { shopDomain: true } },
    },
  });

  // Send to Google Sheets
  try {
    await sendReferralEventRow({
      event_id: event.id,
      event_type: 'IMPRESSION',
      timestamp: new Date().toISOString(),
      from_shop_domain: event.fromShop?.shopDomain || null,
      to_shop_domain: event.toShop?.shopDomain || null,
      offer_id: null,
      discount_code: null,
      discount_code_id: null,
      discount_state: null,
      order_id: orderId,
      order_number: null,
      order_currency: null,
      order_total: null,
      line_item_count: lineItemCount || null,
      user_agent: req.headers['user-agent'] || null,
      referer: req.headers['referer'] || null,
      environment: process.env.NODE_ENV || null,
    });
  } catch (err) {
    console.error(`⚠️ Failed to sync IMPRESSION to sheets: ${err.message}`);
  }

  res.json({ ok: true });
});

/**
 * POST /events/click
 * Records a click on a brand offer
 */
router.post('/click', async (req, res) => {
  const shopDomain = req.headers['x-shopify-shop-domain'];
  const {
    orderId,
    offerBrandDomain,
    lineItemCount,
    position,
  } = req.body;

  if (!shopDomain || !orderId || !offerBrandDomain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const toShop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!toShop) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  const fromShop = await prisma.shop.findFirst({
    where: { shopDomain: offerBrandDomain },
  });

  // Brand may not be installed yet — skip silently
  if (!fromShop) {
    return res.status(200).json({ skipped: true });
  }

  /**
   * Idempotency:
   * one click per (orderId + fromShop + toShop)
   */
  const existing = await prisma.referralEvent.findFirst({
    where: {
      type: 'CLICK',
      fromShopId: fromShop.id,
      toShopId: toShop.id,
      meta: {
        path: ['orderId'],
        equals: orderId,
      },
    },
  });

  if (existing) {
    return res.status(200).json({ ok: true, deduped: true });
  }

  const event = await prisma.referralEvent.create({
    data: {
      type: 'CLICK',
      fromShopId: fromShop.id,
      toShopId: toShop.id,
      meta: {
        orderId,
        offerBrandDomain,
        lineItemCount,
        position,
      },
    },
    include: {
      fromShop: { select: { shopDomain: true } },
      toShop: { select: { shopDomain: true } },
    },
  });

  // Send to Google Sheets
  try {
    await sendReferralEventRow({
      event_id: event.id,
      event_type: 'CLICK',
      timestamp: new Date().toISOString(),
      from_shop_domain: event.fromShop?.shopDomain || null,
      to_shop_domain: event.toShop?.shopDomain || null,
      offer_id: null,
      discount_code: null,
      discount_code_id: null,
      discount_state: null,
      order_id: orderId,
      order_number: null,
      order_currency: null,
      order_total: null,
      line_item_count: lineItemCount || null,
      user_agent: req.headers['user-agent'] || null,
      referer: req.headers['referer'] || null,
      environment: process.env.NODE_ENV || null,
    });
  } catch (err) {
    console.error(`⚠️ Failed to sync CLICK to sheets: ${err.message}`);
  }

  res.json({ ok: true });
});

export default router;