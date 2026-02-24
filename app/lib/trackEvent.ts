import prisma from "../db.server";
import type { Prisma, ReferralEventType } from "@prisma/client";

/**
 * Normal (non-transactional) event tracking
 */
export async function trackEvent({
  type,
  fromShopId,
  toShopId,
  discountCodeId = null,
  meta = {},
}: {
  type: ReferralEventType;
  fromShopId: string;
  toShopId: string;
  discountCodeId?: string | null;
  meta?: Prisma.InputJsonValue;
}) {
  return prisma.referralEvent.create({
    data: {
      type,
      fromShopId,
      toShopId,
      discountCodeId,
      meta,
    },
  });
}

/**
 * Transaction-safe version (THIS is what we use in activateDiscountFromPool)
 */
export async function trackEventTx(
  tx: Prisma.TransactionClient,
  {
    type,
    fromShopId,
    toShopId,
    discountCodeId = null,
    meta = {},
  }: {
    type: ReferralEventType;
    fromShopId: string;
    toShopId: string;
    discountCodeId?: string | null;
    meta?: Prisma.InputJsonValue;
  }
) {
  return tx.referralEvent.create({
    data: {
      type,
      fromShopId,
      toShopId,
      discountCodeId,
      meta,
    },
  });
}
