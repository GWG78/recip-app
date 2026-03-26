import { activateDiscountFromPool } from "../services/activateDiscountFromPool";
import db from "../db.server";

/**
 * LOADER
 * - same inputs
 * - same activation
 * - NO redirect
 */
export async function loader({ params, request }) {
  const offerId = params.offerId;
  if (!offerId) {
    throw new Response("Offer not found", { status: 404 });
  }
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const toShopDomain = url.searchParams.get("toShopDomain");
  const fromShopDomain = url.searchParams.get("fromShopDomain");

  if (!toShopDomain) {
    throw new Response("Missing destination shop", { status: 400 });
  }

  const toShop = await db.shop.findUnique({
    where: { shopDomain: toShopDomain },
    select: { id: true, shopDomain: true },
  });

  if (!toShop) {
    throw new Response("Destination shop not found", { status: 404 });
  }

  const fromShop = fromShopDomain
    ? await db.shop.findUnique({
        where: { shopDomain: fromShopDomain },
        select: { id: true },
      })
    : null;

  const discount = await activateDiscountFromPool({
    toShopId: toShop.id,
    fromShopId: fromShop?.id,
    offerId,
    orderId,
  });

  // Redirect directly to Shopify with auto-applied discount
  const redirectUrl = `https://${toShop.shopDomain}/discount/${discount.code}?redirect=/checkout`;
  return Response.redirect(redirectUrl);
}
