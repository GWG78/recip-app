import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import { trackEventTx } from "../lib/trackEvent";
import { ensureDiscountPool } from "./createPoolCodes";

const EXPIRY_HOURS = 72;
type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export async function activateDiscountFromPool({
  fromShopId,
  toShopId,
  offerId,
  orderId,
  expiryHours = EXPIRY_HOURS,
  adminClient,
}: {
  fromShopId?: string;
  toShopId: string;
  offerId: string;
  orderId?: string;
  expiryHours?: number;
  adminClient?: AdminGraphqlClient;
}) {
  // Make sure at least one POOL code exists before trying to activate.
  await ensureDiscountPool(toShopId, { adminClient });

  const now = new Date();
  const endsAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

  const activatedCode = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1️⃣ Take the oldest POOL code (FIFO)
    const poolCode = await tx.discountCode.findFirst({
      where: {
        toShopId,
        state: "POOL",
      },
      orderBy: { createdAt: "asc" },
    });

    if (!poolCode) {
      throw new Error("No discount codes available");
    }

    // 2️⃣ Activate it
    const activatedCode = await tx.discountCode.update({
      where: { id: poolCode.id },
      data: {
        state: "ACTIVE",
        activatedAt: now,
        startsAt: now,
        endsAt,
      },
    });

    // 3️⃣ Log referral CLICK
    await trackEventTx(tx, {
      type: "CLICK",
      fromShopId: fromShopId ?? toShopId,
      toShopId,
      discountCodeId: activatedCode.id,
      meta: {
        offerId,
        orderId,
      },
    });

    return activatedCode;
  });

  // 3️⃣ Replenish pool outside transaction (includes Shopify Admin API call)
  try {
    await ensureDiscountPool(toShopId, { adminClient });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[pool] replenish after activation failed toShopId=${toShopId}: ${message}`);
  }

  return activatedCode;
}
