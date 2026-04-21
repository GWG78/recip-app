import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import { ReferralEventType } from "@prisma/client";
import { sendReferralEventRow } from "../lib/googleSheets.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const { offerId, orderId, fromShopId, toShopId } = body;

  if (!offerId || !orderId || !toShopId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1️⃣ Deduplicate: one impression per order + offer
  const existing = await prisma.referralEvent.findFirst({
    where: {
      type: ReferralEventType.IMPRESSION,
      toShopId,
      meta: {
        path: ["offerId"],
        equals: offerId,
      },
      AND: {
        meta: {
          path: ["orderId"],
          equals: orderId,
        },
      },
    },
  });

  if (existing) {
    return Response.json({ ok: true, deduped: true });
  }

  // 2️⃣ Create impression event
  const event = await prisma.referralEvent.create({
    data: {
      type: ReferralEventType.IMPRESSION,
      fromShopId: fromShopId ?? toShopId, // safe default
      toShopId,
      meta: {
        offerId,
        orderId,
      },
    },
    include: {
      fromShop: { select: { shopDomain: true } },
      toShop: { select: { shopDomain: true } },
    },
  });

  // 3️⃣ Sync to Google Sheets
  try {
    await sendReferralEventRow({
      event_id: event.id,
      event_type: "IMPRESSION",
      timestamp: new Date().toISOString(),
      from_shop_domain: event.fromShop?.shopDomain ?? null,
      to_shop_domain: event.toShop?.shopDomain ?? null,
      offer_id: offerId,
      discount_code: null,
      discount_code_id: null,
      discount_state: null,
      order_id: orderId,
      order_number: null,
      order_currency: null,
      order_total: null,
      line_item_count: null,
      user_agent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      environment: process.env.NODE_ENV || null,
    });
  } catch (error) {
    console.error(`[api/events/impression] failed to sync to sheets: ${error instanceof Error ? error.message : String(error)}`);
    // Continue anyway - event is already in DB
  }

  return Response.json({ ok: true });
}
