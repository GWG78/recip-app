import type { LoaderFunctionArgs } from "react-router";
import db from "../db.server";

function normalizeDomain(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function buildOfferText(discountType: "PERCENTAGE" | "FIXED", discountValue: number) {
  if (discountType === "FIXED") {
    return `Save ${discountValue.toFixed(2)} on your next order`;
  }
  return `${discountValue}% off your next order`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const rawShop = url.searchParams.get("shop");

  if (!rawShop) {
    return Response.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const sourceDomain = normalizeDomain(rawShop);
  console.log(`[offers] request shop=${sourceDomain}`);
  const sourceShop = await db.shop.findUnique({
    where: { shopDomain: sourceDomain },
    include: { friendly: true },
  });

  if (!sourceShop) {
    console.log(`[offers] source shop not found for ${sourceDomain}`);
    return Response.json({ sourceShopId: null, offers: [] });
  }

  const domains = sourceShop.friendly.map((b) => b.brandDomain);
  if (!domains.length) {
    console.log(`[offers] no friendly brands for ${sourceDomain}`);
    return Response.json({ sourceShopId: sourceShop.id, offers: [] });
  }

  const destinationShops = await db.shop.findMany({
    where: {
      shopDomain: { in: domains },
      installed: true,
      active: true,
    },
    include: {
      settings: {
        select: {
          discountType: true,
          discountValue: true,
        },
      },
    },
    take: 4,
  });

  console.log(`[offers] destinationShops found: ${destinationShops.length}`);
  destinationShops.forEach(shop => {
    console.log(`[offers] dest shop: ${shop.shopDomain}, installed: ${shop.installed}, active: ${shop.active}`);
  });

  const offers = destinationShops.map((shop) => {
    const discountType = shop.settings?.discountType ?? "PERCENTAGE";
    const discountValue = Number(shop.settings?.discountValue ?? 10);

    return {
      offerId: `offer-${shop.id}`,
      toShopId: shop.id,
      toShopDomain: shop.shopDomain,
      brand: shop.shopDomain.replace(".myshopify.com", ""),
      description: "Partner offer",
      offer: buildOfferText(discountType, discountValue),
      discountType,
      discountValue,
    };
  });

  console.log(
    `[offers] source=${sourceDomain} friendly=${domains.length} matched=${offers.length}`,
  );

  return Response.json({ sourceShopId: sourceShop.id, offers });
};
