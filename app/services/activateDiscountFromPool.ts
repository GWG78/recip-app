import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import { trackEventTx } from "../lib/trackEvent";

const EXPIRY_HOURS = 72;

export async function activateDiscountFromPool({
  fromShopId,
  toShopId,
  offerId,
  orderId,
}: {
  fromShopId: string;
  toShopId: string;
  offerId: string;
  orderId?: string;
}) {
  const now = new Date();
  const endsAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1️⃣ Take the oldest POOL code (FIFO)
    const poolCode = await tx.discountCode.findFirst({
      where: {
        toShopId,
        state: 'POOL',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!poolCode) {
      throw new Error('No discount codes available');
    }

    // 2️⃣ Activate it
    const activatedCode = await tx.discountCode.update({
      where: { id: poolCode.id },
      data: {
        state: 'ACTIVE',
        activatedAt: now,
        startsAt: now,
        endsAt,
      },
    });

    // 3️⃣ Log referral CLICK
    await trackEventTx(tx, {
      type: "CLICK",
      fromShopId,
      toShopId,
      discountCodeId: activatedCode.id,
      meta: {
        offerId,
        orderId,
      },
    });

    // 4️⃣ Replenish pool immediately
    await tx.discountCode.create({
      data: {
        toShopId,
        code: generateReplacementCode(),
        state: 'POOL',
      },
    });

    return activatedCode;
  });
}

function generateReplacementCode() {
  return `RECIP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
