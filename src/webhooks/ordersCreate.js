import { prisma } from '../db.js';
import { sendReferralEventRow } from '../integrations/googleSheets.js';

/**
 * Handle Shopify orders/create webhook
 */
export async function handleOrderCreate(req, res) {
  const payload = JSON.parse(req.body.toString());

  const shopDomain = payload.myshopify_domain;
  const orderId = payload.id;
  const orderNumber = payload.name;
  const orderValue = payload.total_price;
  const orderCurrency = payload.currency;
  const lineItemCount = payload.line_items?.length ?? 0;
  const discountCodes = payload.discount_codes || [];

  if (!discountCodes.length) {
    return res.status(200).send('No discount codes');
  }

  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop) {
    return res.status(200).send('Shop not registered');
  }

  for (const d of discountCodes) {
    const code = d.code;

    const discount = await prisma.discountCode.findUnique({
      where: { code },
    });

    if (!discount) continue;

    // Idempotency: already redeemed
    if (discount.redeemedAt) continue;

    // 1️⃣ Update discount record
    await prisma.discountCode.update({
      where: { id: discount.id },
      data: {
        redeemedAt: new Date(),
        orderId: String(orderId),
        orderAmount: Number(orderValue),
      },
    });

    // 2️⃣ Record referral conversion
    await prisma.referralEvent.create({
      data: {
        type: 'ORDER_CREATED',
        fromShopId: discount.fromShopId,
        toShopId: discount.toShopId,
        discountCodeId: discount.id,
        meta: {
          orderId,
          orderValue,
          lineItemCount,
          code,
        },
      },
    });

    // 3️⃣ Sync ORDER event to Google Sheets
    try {
      const toShop = await prisma.shop.findUnique({
        where: { id: discount.toShopId },
        select: { shopDomain: true },
      });
      const fromShop = discount.fromShopId
        ? await prisma.shop.findUnique({
            where: { id: discount.fromShopId },
            select: { shopDomain: true },
          })
        : null;

      await sendReferralEventRow({
        event_id: discount.id,
        event_type: 'ORDER',
        timestamp: new Date().toISOString(),
        from_shop_domain: fromShop?.shopDomain ?? null,
        to_shop_domain: toShop?.shopDomain ?? null,
        offer_id: null, // We don't have offer_id in webhook context
        discount_code: code,
        discount_code_id: discount.id,
        discount_state: 'REDEEMED',
        order_id: String(orderId),
        order_number: orderNumber,
        order_currency: orderCurrency,
        order_total: Number(orderValue),
        line_item_count: lineItemCount,
        user_agent: null,
        referer: null,
        environment: process.env.NODE_ENV || null,
      });
    } catch (error) {
      console.error(`[orders/create] failed to sync ORDER event to sheets: ${error.message}`);
      // Continue anyway - event is already in DB
    }
  }

  res.status(200).send('OK');
}