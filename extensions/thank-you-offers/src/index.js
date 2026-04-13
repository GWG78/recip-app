import '@shopify/ui-extensions/preact';
import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

const APP_BASE_URL = "https://recip-app-5alg.onrender.com";

function readSignal(value) {
  if (value && typeof value === 'object') {
    if ('value' in value) return value.value;
    if ('current' in value) return value.current;
  }
  return value;
}


async function trackImpression({ offerId, orderId, fromShopId, toShopId }) {
  try {
    await fetch(`${APP_BASE_URL}/api/events/impression`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offerId,
        orderId,
        fromShopId,
        toShopId,
      }),
    });
  } catch (err) {
    console.warn("Impression tracking failed", err);
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
  toShopId,
}) {
  const query = new URLSearchParams();
  if (orderId) query.set("orderId", orderId);
  if (toShopDomain) query.set("toShopDomain", toShopDomain);
  if (fromShopDomain) query.set("fromShopDomain", fromShopDomain);

  const offerUrl = orderId
    ? `${APP_BASE_URL}/r/${offerId}?${query.toString()}`
    : `${APP_BASE_URL}/r/${offerId}?${query.toString()}`;

  if (orderId && toShopId) {
    trackImpression({ offerId, orderId, fromShopId, toShopId });
  }

  return h(
    's-stack',
    {
      gap: 'base',
      padding: 'base',
      border: 'base',
      borderRadius: 'base',
      inlineSize: 'fill',
    },

    // Brand header with logo and name
    h(
      's-box',
      { padding: 'none', marginBlockEnd: 'base' },
      h(
        's-stack',
        { gap: 'base', direction: 'inline', alignItems: 'start' },
        
        // Logo
        h('s-image', {
          src: logoUrl || 'https://placehold.co/64x64?text=Logo',
          alt: `${brand} logo`,
          width: 64,
          height: 64,
        }),

        // Brand info
        h(
          's-stack',
          { gap: 'none' },
          h('s-text', { emphasis: true, size: 'large' }, brand),
          h(
            's-text',
            { size: 'small', appearance: 'subdued' },
            offer
          )
        )
      )
    ),

    // Description
    h(
      's-text',
      { appearance: 'subdued' },
      description
    ),

    // CTA
    h(
      's-link',
      {
        href: offerUrl,
        target: '_blank',
      },
      'View offer'
    )
  );
}

function App() {
  const orderApi = typeof shopify !== 'undefined' ? readSignal(shopify.order) : null;
  const orderId = orderApi?.id ? String(orderApi.id) : null;
  const shopApi = typeof shopify !== 'undefined' ? readSignal(shopify.shop) : null;
  const fromShopDomain =
    (shopApi && shopApi.myshopifyDomain)
      ? shopApi.myshopifyDomain
      : globalThis.location?.hostname || null;
  console.log('[thank-you-offers] fromShopDomain:', fromShopDomain, 'shopApi:', shopApi, 'location.hostname:', globalThis.location?.hostname);
  const [offersState, setOffersState] = useState([]);
  const [sourceShopId, setSourceShopId] = useState(null);

  useEffect(() => {
    async function loadOffers() {
      const requestedShop = fromShopDomain || '';
      console.log('[thank-you-offers] loadOffers requestedShop:', requestedShop);

      try {
        const res = await fetch(
          `${APP_BASE_URL}/api/offers?shop=${encodeURIComponent(requestedShop)}`,
        );
        const data = await res.json();
        console.log('[thank-you-offers] offers response:', data);
        setOffersState(Array.isArray(data.offers) ? data.offers : []);
        setSourceShopId(data.sourceShopId || null);
      } catch (err) {
        console.warn("Failed to load offers", err);
        setOffersState([]);
      }
    }

    loadOffers();
  }, [fromShopDomain]);

  return h(
    's-stack',
    { gap: 'base' },

    // Header
    h('s-text', { emphasis: true }, '🎉 Recommended for you'),

    offersState.length === 0
      ? h('s-text', { appearance: 'subdued' }, 'No partner offers available yet')
      : null,

    // 2x2 grid
    h(
      's-grid',
      {
        gap: 'base',
        gridTemplateColumns: '1fr 1fr',
      },
      offersState.map((offerItem) =>
        h(OfferCard, {
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
          toShopId: offerItem.toShopId,
        }),
      )
    )
  );
}

export default function renderThankYouOffers() {
  render(h(App), document.body);
}
