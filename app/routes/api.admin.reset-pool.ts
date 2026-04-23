import type { LoaderFunctionArgs } from "react-router";
import db from "../db.server";
import { ensureDiscountPool } from "../services/createPoolCodes";

// One-time utility: deletes placeholder discount codes (never synced to Shopify)
// and triggers a fresh pool creation for all shops.
// Hit GET /api/admin/reset-pool?secret=<ADMIN_SECRET> after reinstalling the app.

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = url.searchParams.get("shop");

  const whereClause = {
    shopifyDiscountGid: { startsWith: "gid://recip/DiscountCodePlaceholder/" },
    state: "POOL" as const,
    ...(shop ? { toShop: { shopDomain: shop } } : {}),
  };

  const deleted = await db.discountCode.deleteMany({ where: whereClause });

  const shops = shop
    ? await db.shop.findMany({ where: { shopDomain: shop }, select: { id: true, shopDomain: true } })
    : await db.shop.findMany({ where: { installed: true }, select: { id: true, shopDomain: true } });

  const results: Record<string, unknown> = {};
  for (const s of shops) {
    try {
      const result = await ensureDiscountPool(s.id);
      results[s.shopDomain] = result;
    } catch (err) {
      results[s.shopDomain] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return Response.json({
    deletedPlaceholders: deleted.count,
    poolResults: results,
  });
};
