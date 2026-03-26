import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import { trackEventTx } from "../lib/trackEvent";
import { ensureDiscountPool } from "./createPoolCodes";
import { sendReferralEventRow } from "../lib/googleSheets.server";

const EXPIRY_HOURS = 72;
const UPDATE_DISCOUNT_MUTATION = `
mutation discountCodeBasicUpdate($id: ID!, $basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicUpdate(id: $id, basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;
type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

async function updateShopifyDiscount(
  adminClient: AdminGraphqlClient,
  discountGid: string,
  startsAt: Date,
  endsAt: Date,
) {
  const response = await adminClient.graphql(UPDATE_DISCOUNT_MUTATION, {
    variables: {
      id: discountGid,
      basicCodeDiscount: {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      },
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify API HTTP ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as {
    data?: {
      discountCodeBasicUpdate?: {
        userErrors?: Array<{ message?: string | null }> | null;
      };
    };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).join("; "));
  }

  const result = payload.data?.discountCodeBasicUpdate;
  const userErrors = result?.userErrors ?? [];
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).filter(Boolean).join("; "));
  }
}

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
  // Make sure at least one POOL code exists before trying to activate (only if we have admin access)
  if (adminClient) {
    try {
      await ensureDiscountPool(toShopId, { adminClient });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pool] failed to ensure pool for toShopId=${toShopId}: ${message}`);
      // Continue anyway - maybe there are existing POOL codes
    }
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

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

  // 4️⃣ Update Shopify discount timing (skip if no admin access)
  if (adminClient) {
    try {
      await updateShopifyDiscount(
        adminClient,
        activatedCode.shopifyDiscountGid,
        activatedCode.startsAt,
        activatedCode.endsAt,
      );
      console.log(`[activation] updated Shopify discount ${activatedCode.code}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[activation] failed to update Shopify discount ${activatedCode.code}: ${message}`);
      // Continue anyway - DB is updated, user can still use the code
    }
  } else {
    console.log(`[activation] skipping Shopify update for ${activatedCode.code} (no admin access)`);
  }

  // 5️⃣ Replenish pool (skip if no admin access)
  if (adminClient) {
    try {
      const replenishResult = await ensureDiscountPool(toShopId, { adminClient });
      console.log(
        `[pool] replenish after click toShopId=${toShopId} created=${replenishResult.created} poolSize=${replenishResult.poolSize}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pool] replenish after activation failed toShopId=${toShopId}: ${message}`);
    }
  } else {
    console.log(`[pool] skipping replenish for toShopId=${toShopId} (no admin access)`);
  }

  // 6️⃣ Sync CLICK event to Google Sheets
  try {
    const toShop = await prisma.shop.findUnique({
      where: { id: toShopId },
      select: { shopDomain: true },
    });
    const fromShop = fromShopId
      ? await prisma.shop.findUnique({
          where: { id: fromShopId },
          select: { shopDomain: true },
        })
      : null;

    await sendReferralEventRow({
      event_id: activatedCode.id,
      event_type: "CLICK",
      timestamp: activatedCode.activatedAt?.toISOString() || new Date().toISOString(),
      from_shop_domain: fromShop?.shopDomain ?? null,
      to_shop_domain: toShop?.shopDomain ?? null,
      offer_id: offerId,
      discount_code: activatedCode.code,
      discount_code_id: activatedCode.id,
      discount_state: "ACTIVE",
      order_id: orderId ?? null,
      order_number: null,
      order_currency: null,
      order_total: null,
      line_item_count: null,
      user_agent: null,
      referer: null,
      environment: process.env.NODE_ENV || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[activation] failed to sync CLICK event to sheets: ${message}`);
    // Continue anyway - event is already in DB
  }

  return activatedCode;
}
