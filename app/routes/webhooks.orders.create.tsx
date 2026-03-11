import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendReferralEventRow } from "../lib/googleSheets.server";

type OrdersCreatePayload = {
  id?: string | number;
  order_number?: string | number;
  currency?: string;
  presentment_currency?: string;
  total_price?: string | number;
  line_items?: unknown[];
  discount_codes?: Array<{ code?: string }>;
  discount_applications?: Array<{ type?: string; code?: string }>;
};

function extractOrderDiscountCodes(payload: OrdersCreatePayload): string[] {
  const fromDiscountCodes =
    payload.discount_codes
      ?.map((d) => d.code?.trim())
      .filter((code): code is string => Boolean(code)) ?? [];

  const fromApplications =
    payload.discount_applications
      ?.filter((d) => d.type === "discount_code")
      .map((d) => d.code?.trim())
      .filter((code): code is string => Boolean(code)) ?? [];

  return [...new Set([...fromDiscountCodes, ...fromApplications])];
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const order = payload as OrdersCreatePayload;
  const usedCodes = extractOrderDiscountCodes(order);

  if (!usedCodes.length) {
    console.log(`[orders/create] no discount codes on order for ${shop}`);
    return new Response();
  }

  const matched = await db.discountCode.findFirst({
    where: {
      code: { in: usedCodes },
      toShop: { shopDomain: shop },
    },
    orderBy: { activatedAt: "desc" },
  });

  if (!matched) {
    console.log(
      `[orders/create] no matching Recip code found for ${shop}. used=${usedCodes.join(",")}`,
    );
    return new Response();
  }

  const orderId = order.id ? String(order.id) : null;
  const orderAmount =
    typeof order.total_price !== "undefined" ? String(order.total_price) : null;
  const lineItemCount = Array.isArray(order.line_items) ? order.line_items.length : null;

  await db.discountCode.update({
    where: { id: matched.id },
    data: {
      state: "REDEEMED",
      redeemedAt: new Date(),
      orderId,
      orderAmount,
      lineItemCount,
    },
  });

  const clickEvent = await db.referralEvent.findFirst({
    where: {
      discountCodeId: matched.id,
      type: "CLICK",
    },
    orderBy: { timestamp: "desc" },
    include: {
      fromShop: { select: { shopDomain: true } },
      toShop: { select: { shopDomain: true } },
    },
  });

  const meta = (clickEvent?.meta as { offerId?: string } | null) ?? null;
  await sendReferralEventRow({
    event_id: `${matched.id}:${orderId ?? Date.now().toString()}`,
    event_type: "ORDER_CREATED",
    timestamp: new Date().toISOString(),
    from_shop_domain: clickEvent?.fromShop?.shopDomain ?? null,
    to_shop_domain: clickEvent?.toShop?.shopDomain ?? shop,
    offer_id: meta?.offerId ?? null,
    discount_code: matched.code,
    discount_code_id: matched.id,
    discount_state: "REDEEMED",
    order_id: orderId,
    order_number: order.order_number ? String(order.order_number) : null,
    order_currency: order.currency || order.presentment_currency || null,
    order_total: orderAmount,
    line_item_count: lineItemCount,
    user_agent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    environment: process.env.NODE_ENV || null,
  });

  console.log(
    `[orders/create] marked REDEEMED code=${matched.code} shop=${shop} orderId=${orderId ?? "-"}`,
  );

  return new Response();
};
