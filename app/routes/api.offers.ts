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
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(request.url);
  const rawShop = url.searchParams.get("shop");

  if (!rawShop) {
    return Response.json({ error: "Missing shop parameter" }, { 
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const sourceDomain = normalizeDomain(rawShop);
  console.log(`[offers] request shop=${sourceDomain}`);
  const sourceShop = await db.shop.findUnique({
    where: { shopDomain: sourceDomain },
    include: { friendly: true },
  });

  if (!sourceShop) {
    console.log(`[offers] source shop not found for ${sourceDomain}`);
    return Response.json({ sourceShopId: null, offers: [] }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const domains = sourceShop.friendly.map((b) => b.brandDomain);

  // Fetch friendly brand offers (prioritized) if they exist
  const friendlyShops =
    domains.length > 0
      ? await db.shop.findMany({
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
                brandName: true,
                brandDescription: true,
                logoUrl: true,
              },
            },
          },
          take: 2, // Max 2 friendly brands
        })
      : [];

  // Fetch other active shops (fallback, up to 4 or remaining slots to reach 4 total)
  const remainingSlots = Math.max(0, 4 - friendlyShops.length);
  const otherShops =
    remainingSlots > 0
      ? await db.shop.findMany({
          where: {
            ...(domains.length > 0 ? { shopDomain: { notIn: domains } } : {}), // Exclude friendly brands only if they exist
            installed: true,
            active: true,
          },
          include: {
            settings: {
              select: {
                discountType: true,
                discountValue: true,
                brandName: true,
                brandDescription: true,
                logoUrl: true,
              },
            },
          },
          take: remainingSlots,
        })
      : [];

  console.log(
    `[offers] friendly=${friendlyShops.length} other=${otherShops.length}`
  );

  // Combine: friendly first, then others
  const destinationShops = [...friendlyShops, ...otherShops];

  const offers = destinationShops.map((shop) => {
    const discountType = shop.settings?.discountType ?? "PERCENTAGE";
    const discountValue = Number(shop.settings?.discountValue ?? 10);

    return {
      offerId: `offer-${shop.id}`,
      toShopId: shop.id,
      toShopDomain: shop.shopDomain,
      brand: shop.settings?.brandName || shop.shopDomain.replace(".myshopify.com", ""),
      description: shop.settings?.brandDescription || "Partner offer",
      offer: buildOfferText(discountType, discountValue),
      discountType,
      discountValue,
      logoUrl: shop.settings?.logoUrl || undefined,
    };
  });

  console.log(
    `[offers] source=${sourceDomain} friendly=${domains.length} matched=${offers.length}`,
  );

  return Response.json({ sourceShopId: sourceShop.id, offers }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
