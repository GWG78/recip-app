// extensions/thank-you-offers/src/index.js
import "@shopify/ui-extensions/preact";
import { h, render } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
function resolveAppBaseUrl() {
  const explicit = typeof globalThis !== "undefined" ? globalThis.APP_BASE_URL : null;
  if (explicit) return explicit;
  try {
    const search = globalThis?.location?.search || "";
    const params = new URLSearchParams(search);
    const devParam = params.get("dev");
    if (devParam) {
      const decoded = decodeURIComponent(devParam);
      if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
        return decoded.replace(/\/extensions\/?$/, "");
      }
    }
  } catch (_err) {
  }
  return "https://recip-app-5alg.onrender.com";
}
var APP_BASE_URL = resolveAppBaseUrl();
function readSignal(value) {
  if (value && typeof value === "object") {
    if ("value" in value) return value.value;
    if ("current" in value) return value.current;
  }
  return value;
}
function normalizeDomain(value) {
  return String(value || "").toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}
function resolveShopDomain(shopRef) {
  const shop = readSignal(shopRef);
  const candidates = [
    shop?.myshopifyDomain,
    shop?.shopDomain,
    shop?.domain,
    shop?.permanentDomain,
    readSignal(shop?.myshopifyDomain),
    readSignal(shop?.shopDomain),
    readSignal(shop?.domain),
    readSignal(shop?.permanentDomain)
  ];
  for (const candidate of candidates) {
    const normalized = normalizeDomain(readSignal(candidate));
    if (normalized && normalized.includes(".myshopify.com")) {
      return normalized;
    }
  }
  return null;
}
async function trackImpression({ offerId, orderId, fromShopId, toShopId }) {
  try {
    await fetch(`${APP_BASE_URL}/api/events/impression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, orderId, fromShopId, toShopId })
    });
  } catch (err) {
    console.warn("[track] impression failed", err);
  }
}
function OfferCard({
  offerId,
  brand,
  description,
  offer,
  logoUrl,
  orderId,
  fromShopDomain,
  fromShopId,
  toShopDomain,
  toShopId
}) {
  const [cardState, setCardState] = useState("initial");
  const [discountCode, setDiscountCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [logoReady, setLogoReady] = useState(false);
  useEffect(() => {
    if (orderId && fromShopId && toShopId) {
      trackImpression({ offerId, orderId, fromShopId, toShopId });
    }
  }, [offerId, orderId, fromShopId, toShopId]);
  useEffect(() => {
    setLogoReady(false);
    if (!logoUrl) return;
    fetch(logoUrl, { method: "HEAD" }).then((res) => {
      if (res.ok) setLogoReady(true);
    }).catch(() => {
    });
  }, [logoUrl]);
  const handleFirstCtaClick = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setCardState("revealing");
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        offerId,
        toShopDomain,
        fromShopDomain: fromShopDomain || "",
        orderId: orderId || ""
      });
      const response = await fetch(`${APP_BASE_URL}/api/activate-code?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      const data = await response.json();
      if (!response.ok || !data?.code) {
        throw new Error(data?.error || "Failed to activate code");
      }
      setDiscountCode(data.code);
      setCardState("revealed");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
      setCardState("error");
    }
  };
  const redirectUrl = discountCode && toShopDomain ? `https://${toShopDomain}/discount/${discountCode}?redirect=/collections/all` : null;
  return h(
    "s-stack",
    { gap: "base", padding: "base", border: "base", borderRadius: "base", inlineSize: "fill" },
    h(
      "s-grid",
      { gridTemplateColumns: "64px 1fr", gap: "base", alignItems: "center" },
      h(
        "s-box",
        {
          border: "base",
          borderRadius: "base",
          background: "base",
          padding: "none",
          inlineSize: "64px",
          blockSize: "64px",
          overflow: "hidden"
        },
        logoReady ? h("s-image", {
          src: logoUrl,
          alt: `${brand} logo`,
          inlineSize: "fill",
          aspectRatio: "1/1",
          objectFit: "cover"
        }) : h(
          "s-box",
          { padding: "small", inlineSize: "fill", blockSize: "fill" },
          h("s-text", { type: "strong" }, (brand || "?").slice(0, 1).toUpperCase())
        )
      ),
      h(
        "s-stack",
        { gap: "none" },
        h("s-heading", null, brand),
        h("s-text", { color: "subdued" }, offer)
      )
    ),
    h("s-text", { color: "subdued" }, description),
    cardState !== "initial" && cardState !== "revealing" ? h(
      "s-stack",
      { gap: "small" },
      h("s-text", { color: "subdued" }, "Your discount code"),
      h(
        "s-box",
        { padding: "small", border: "base", borderRadius: "base", background: "subdued" },
        h(
          "s-stack",
          { gap: "none", alignItems: "center" },
          h("s-text", { type: "strong" }, discountCode)
        )
      ),
      cardState === "revealed" ? h(
        "s-stack",
        { gap: "extraSmall" },
        h("s-button", { kind: "primary", href: redirectUrl, inlineSize: "fill" }, "Shop now"),
        h("s-text", { color: "subdued" }, "Code applied automatically at checkout")
      ) : null
    ) : null,
    cardState === "revealing" ? h("s-box", { padding: "small" }, h("s-text", { color: "subdued" }, "Generating your discount code...")) : null,
    cardState === "error" ? h("s-box", { padding: "small" }, h("s-text", { tone: "warning" }, `Error: ${errorMessage || "Failed to load code"}`)) : null,
    cardState === "initial" || cardState === "error" ? h(
      "s-button",
      {
        kind: cardState === "initial" ? "primary" : "secondary",
        onClick: handleFirstCtaClick,
        inlineSize: "fill"
      },
      cardState === "initial" ? "Unlock offer" : "Try again"
    ) : null
  );
}
function App() {
  const orderApi = typeof shopify !== "undefined" ? shopify.order : null;
  const shopApi = typeof shopify !== "undefined" ? shopify.shop : null;
  const orderId = useMemo(() => {
    const order = readSignal(orderApi);
    return order?.id ? String(readSignal(order.id)) : null;
  }, [orderApi]);
  const fromShopDomain = useMemo(() => {
    const resolved = resolveShopDomain(shopApi);
    const fallback = normalizeDomain(globalThis.location?.hostname || "");
    const domain = resolved || (fallback.includes(".myshopify.com") ? fallback : null);
    console.log("[thank-you-offers] fromShopDomain:", domain, "shopApi:", readSignal(shopApi), "location.hostname:", globalThis.location?.hostname || "");
    return domain;
  }, [shopApi]);
  const [offersState, setOffersState] = useState([]);
  const [sourceShopId, setSourceShopId] = useState(null);
  useEffect(() => {
    async function loadOffers() {
      const requestedShop = normalizeDomain(fromShopDomain || "");
      console.log("[thank-you-offers] loadOffers requestedShop:", requestedShop, "base:", APP_BASE_URL);
      if (!requestedShop) {
        setOffersState([]);
        setSourceShopId(null);
        return;
      }
      try {
        const res = await fetch(`${APP_BASE_URL}/api/offers?shop=${encodeURIComponent(requestedShop)}`);
        const data = await res.json();
        setOffersState(Array.isArray(data?.offers) ? data.offers : []);
        setSourceShopId(data?.sourceShopId || null);
      } catch (err) {
        console.warn("Failed to load offers", err);
        setOffersState([]);
        setSourceShopId(null);
      }
    }
    loadOffers();
  }, [fromShopDomain]);
  return h(
    "s-stack",
    { gap: "base" },
    h("s-text", { emphasis: true }, "Recommended for you"),
    offersState.length === 0 ? h("s-text", { appearance: "subdued" }, "No partner offers available yet") : null,
    h(
      "s-grid",
      { gap: "base", gridTemplateColumns: "1fr 1fr" },
      offersState.map(
        (offerItem) => h(OfferCard, {
          key: offerItem.offerId,
          offerId: offerItem.offerId,
          brand: offerItem.brand,
          description: offerItem.description,
          offer: offerItem.offer,
          logoUrl: offerItem.logoUrl,
          orderId,
          fromShopDomain,
          fromShopId: sourceShopId,
          toShopDomain: offerItem.toShopDomain,
          toShopId: offerItem.toShopId
        })
      )
    )
  );
}
function renderThankYouOffers() {
  render(h(App), document.body);
}
export {
  renderThankYouOffers as default
};
