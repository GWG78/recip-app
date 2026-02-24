import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import { ReferralEventType } from "@prisma/client";

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
  await prisma.referralEvent.create({
    data: {
      type: ReferralEventType.IMPRESSION,
      fromShopId: fromShopId ?? toShopId, // safe default
      toShopId,
      meta: {
        offerId,
        orderId,
      },
    },
  });

  return Response.json({ ok: true });
}
