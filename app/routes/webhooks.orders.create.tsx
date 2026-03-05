import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

type OrdersCreatePayload = {
  id?: string | number;
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

  console.log(
    `[orders/create] marked REDEEMED code=${matched.code} shop=${shop} orderId=${orderId ?? "-"}`,
  );

  return new Response();
};
