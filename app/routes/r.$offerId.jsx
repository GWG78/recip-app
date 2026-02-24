import { useLoaderData } from "react-router";
import { activateDiscountFromPool } from "../services/activateDiscountFromPool";

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

  const toShopId = "DESTINATION_SHOP_ID"; // unchanged
  const shopDomain = `${toShopId}.myshopify.com`;

  const discount = await activateDiscountFromPool({
    toShopId,
    offerId,
    orderId,
  });

  return Response.json({
    code: discount.code,
    shopUrl: `https://${shopDomain}/discount/${discount.code}`,
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
