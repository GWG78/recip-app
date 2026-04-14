import type { LoaderFunctionArgs } from "react-router";
import { activate } from "../shopify.server";
import db from "../db.server";
import { activateDiscountFromPool } from "../services/activateDiscountFromPool";
import { resolveAdminClient } from "../services/createPoolCodes";

/**
 * POST /api/activate-code
 * 
 * Activates a discount code from the pool and returns it.
 * Called on first CTA click from thank-you page offer cards.
 * 
 * Body:
 *   - offerId: string (e.g., "offer-${shop.id}")
 *   - toShopDomain: string (destination shop domain)
 *   - fromShopDomain: string (source/host shop domain)
 *   - orderId: string (optional, from thank-you page)
 * 
 * Returns:
 *   - code: string (the activated discount code)
 *   - expiresAt: ISO string
 *   - success: boolean
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return Response.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  try {
    const body = (await request.json()) as {
      offerId?: string;
      toShopDomain?: string;
      fromShopDomain?: string;
      orderId?: string;
    };

    const { offerId, toShopDomain, fromShopDomain, orderId } = body;

    if (!offerId || !toShopDomain) {
      return Response.json(
        { error: "Missing offerId or toShopDomain" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Find the destination shop
    const toShop = await db.shop.findUnique({
      where: { shopDomain: toShopDomain },
      select: { id: true, shopDomain: true },
    });

    if (!toShop) {
      return Response.json(
        { error: "Destination shop not found" },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Find source shop if provided
    const fromShop = fromShopDomain
      ? await db.shop.findUnique({
          where: { shopDomain: fromShopDomain },
          select: { id: true },
        })
      : null;

    // Try to get admin client for destination shop
    let adminClient;
    try {
      adminClient = await resolveAdminClient(toShop.id);
    } catch (error) {
      console.log(
        `[activate-code] no admin access for destination shop ${toShopDomain}, skipping Shopify updates`
      );
    }

    // Activate a code from the pool
    const activatedCode = await activateDiscountFromPool({
      toShopId: toShop.id,
      fromShopId: fromShop?.id,
      offerId,
      orderId,
      adminClient,
    });

    return Response.json(
      {
        success: true,
        code: activatedCode.code,
        expiresAt: activatedCode.endsAt?.toISOString() || null,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[activate-code] error: ${message}`);

    return Response.json(
      { error: "Failed to activate code", details: message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
};
