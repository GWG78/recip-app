import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import { trackEventTx } from "../lib/trackEvent";
import { ensureDiscountPool } from "./createPoolCodes";

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

  return activatedCode;
}
