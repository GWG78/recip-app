import { randomBytes } from "crypto";
import prisma from "../db.server";

const DEFAULT_POOL_SIZE = 3;
const DEFAULT_EXPIRY_HOURS = 72;
const SHOPIFY_API_VERSION = "2025-10";

const CREATE_DISCOUNT_CODE_MUTATION = `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
      codeDiscount {
        ... on DiscountCodeBasic {
          title
        }
      }
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;

type DiscountKind = "PERCENTAGE" | "FIXED";

type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

type EnsurePoolOptions = {
  poolSize?: number;
  prefix?: string;
  expiryHours?: number;
  discountKind?: DiscountKind;
  discountValue?: number;
  adminClient?: AdminGraphqlClient;
};

type ShopifyCreateResult = {
  gid: string;
  code: string;
  startsAt: Date;
  endsAt: Date;
};

function generateCode(prefix: string) {
  return `${prefix}${randomBytes(3).toString("hex").toUpperCase()}`;
}

function buildValueInput(discountKind: DiscountKind, discountValue: number) {
  if (discountKind === "FIXED") {
    return {
      discountAmount: {
        amount: discountValue.toFixed(2),
        appliesOnEachItem: false,
      },
    };
  }

  // Shopify expects percent in decimal form (e.g. 10% => 0.10).
  return { percentage: discountValue / 100 };
}

export async function resolveAdminClient(
  toShopId: string,
  injectedClient?: AdminGraphqlClient,
): Promise<AdminGraphqlClient> {
  if (injectedClient) return injectedClient;

  const shop = await prisma.shop.findUnique({
    where: { id: toShopId },
    select: { shopDomain: true, accessToken: true },
  });

  if (!shop?.shopDomain || !shop.accessToken) {
    throw new Error(
      `Missing shop credentials for toShopId=${toShopId}; pass adminClient or persist shop token`,
    );
  }
  const accessToken = shop.accessToken;

  return {
    graphql: async (query: string, options?: { variables?: Record<string, unknown> }) => {
      const response = await fetch(
        `https://${shop.shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query,
            variables: options?.variables ?? {},
          }),
        },
      );
      return response;
    },
  };
}

export async function createShopifyDiscountCode(args: {
  adminClient: AdminGraphqlClient;
  code: string;
  discountKind: DiscountKind;
  discountValue: number;
  expiryHours?: number;
}): Promise<ShopifyCreateResult> {
  const startsAt = new Date();
  // For pool codes, use 1 year expiry; for immediate use, use provided expiry
  const defaultExpiryHours = args.expiryHours ?? (365 * 24); // 1 year
  const endsAt = new Date(startsAt.getTime() + defaultExpiryHours * 60 * 60 * 1000);

  const variables = {
    basicCodeDiscount: {
      title: args.code,
      code: args.code,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value: buildValueInput(args.discountKind, args.discountValue),
        items: { all: true },
      },
      appliesOncePerCustomer: true,
      usageLimit: 1,
    },
  };

  const response = await args.adminClient.graphql(CREATE_DISCOUNT_CODE_MUTATION, {
    variables,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify API HTTP ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as {
    data?: {
      discountCodeBasicCreate?: {
        codeDiscountNode?: { id?: string | null } | null;
        userErrors?: Array<{ message?: string | null }> | null;
      };
    };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).join("; "));
  }

  const result = payload.data?.discountCodeBasicCreate;
  const userErrors = result?.userErrors ?? [];
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).filter(Boolean).join("; "));
  }

  const gid = result?.codeDiscountNode?.id;
  if (!gid) {
    throw new Error("Shopify response missing codeDiscountNode.id");
  }

  return {
    gid,
    code: args.code,
    startsAt,
    endsAt,
  };
}

export async function ensureDiscountPool(toShopId: string, options: EnsurePoolOptions = {}) {
  const settings = await prisma.shopSettings.findUnique({
    where: { shopId: toShopId },
    select: { discountType: true, discountValue: true },
  });

  const settingsDiscountType = settings?.discountType ?? "PERCENTAGE";
  const rawSettingsValue = settings?.discountValue ? Number(settings.discountValue) : 10;
  const settingsDiscountValue =
    settingsDiscountType === "PERCENTAGE" && rawSettingsValue <= 1
      ? rawSettingsValue * 100
      : rawSettingsValue;

  const poolSize = options.poolSize ?? DEFAULT_POOL_SIZE;
  const prefix = options.prefix ?? "RECIP";
  const expiryHours = options.expiryHours ?? DEFAULT_EXPIRY_HOURS;
  const discountKind = options.discountKind ?? settingsDiscountType;
  const discountValue = options.discountValue ?? settingsDiscountValue;

  const adminClient = await resolveAdminClient(toShopId, options.adminClient);

  const initialPool = await prisma.discountCode.count({
    where: { toShopId, state: "POOL" },
  });

  console.log(
    `[pool] toShopId=${toShopId} current=${initialPool} target=${poolSize}`,
  );

  if (initialPool >= poolSize) {
    console.log(`[pool] toShopId=${toShopId} already full`);
    return { created: 0, poolSize: initialPool };
  }

  const createdCodes: string[] = [];
  const targetMissing = poolSize - initialPool;

  for (let i = 0; i < targetMissing; i += 1) {
    const currentPool = await prisma.discountCode.count({
      where: { toShopId, state: "POOL" },
    });

    if (currentPool >= poolSize) break;

    const code = generateCode(prefix);
    
    // DB-only placeholder when Shopify creation fails.
    // Use a non-Shopify namespace so downstream code can detect and skip API updates.
    const generatedGid = `gid://recip/DiscountCodePlaceholder/${code}`;
    
    try {
      const shopifyResult = await createShopifyDiscountCode({
        adminClient,
        code,
        discountKind,
        discountValue,
        // Don't pass expiryHours for pool codes - they should last indefinitely
      });

      // Shopify succeeded, update with real GID
      await prisma.discountCode.create({
        data: {
          toShopId,
          code: shopifyResult.code,
          shopifyDiscountGid: shopifyResult.gid,
          state: "POOL",
          startsAt: shopifyResult.startsAt,
          endsAt: shopifyResult.endsAt,
        },
      });
      
      createdCodes.push(code);
      console.log(`[pool] toShopId=${toShopId} created ${code} (Shopify)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pool] toShopId=${toShopId} failed creating code ${code} in Shopify: ${message}`);
      
      // Shopify failed, but still create DB record with placeholder GID
      // This allows activation to proceed even without Shopify access
      try {
        const now = new Date();
        const endsAt = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
        
        await prisma.discountCode.create({
          data: {
            toShopId,
            code,
            shopifyDiscountGid: generatedGid,
            state: "POOL",
            startsAt: now,
            endsAt,
          },
        });
        
        createdCodes.push(code);
        console.log(`[pool] toShopId=${toShopId} created ${code} (DB only, Shopify access not available)`);
      } catch (dbError) {
        const dbMessage = dbError instanceof Error ? dbError.message : String(dbError);
        console.error(`[pool] toShopId=${toShopId} failed creating DB record for ${code}: ${dbMessage}`);
      }
    }
  }

  const finalPool = await prisma.discountCode.count({
    where: { toShopId, state: "POOL" },
  });

  console.log(
    `[pool] toShopId=${toShopId} final=${finalPool} created=${createdCodes.length} codes=${createdCodes.join(",") || "-"}`,
  );

  return { created: createdCodes.length, poolSize: finalPool, codes: createdCodes };
}

export async function createPoolCodes({
  toShopId,
  prefix = "RECIP",
  count = DEFAULT_POOL_SIZE,
  discountKind = "PERCENTAGE",
  discountValue = 10,
  expiryHours = DEFAULT_EXPIRY_HOURS,
  adminClient,
}: {
  toShopId: string;
  prefix?: string;
  count?: number;
  discountKind?: DiscountKind;
  discountValue?: number;
  expiryHours?: number;
  adminClient?: AdminGraphqlClient;
}) {
  return ensureDiscountPool(toShopId, {
    poolSize: count,
    prefix,
    discountKind,
    discountValue,
    expiryHours,
    adminClient,
  });
}
