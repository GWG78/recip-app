import { useLoaderData } from "react-router";
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

  return Response.json({
    code: discount.code,
    shopUrl: `https://${toShop.shopDomain}/discount/${discount.code}`,
  });
}

/**
 * PAGE UI
 * - shows code
 * - copy button
 * - shop-now CTA
 */
export default function OfferPage() {
  const { code, shopUrl } = useLoaderData();

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "48px auto",
        fontFamily: "system-ui",
        padding: 16,
      }}
    >
      <h2>🎉 Your discount is ready</h2>

      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          fontSize: 18,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {code}
      </div>

      <button
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 12,
          cursor: "pointer",
        }}
        onClick={() => navigator.clipboard.writeText(code)}
      >
        Copy code
      </button>

      <a href={shopUrl} target="_blank" rel="noreferrer">
        <button
          style={{
            width: "100%",
            padding: 12,
            background: "black",
            color: "white",
            cursor: "pointer",
          }}
        >
          Shop now
        </button>
      </a>
    </div>
  );
}
