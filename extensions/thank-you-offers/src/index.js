import '@shopify/ui-extensions/preact';
import { h, render } from 'preact';

const APP_BASE_URL = "https://sleep-change-apparent-divx.trycloudflare.com";


async function trackImpression({ offerId, orderId }) {
  try {
    await fetch("/api/events/impression", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offerId,
        orderId,
        toShopId: "DESTINATION_SHOP_ID",
      }),
    });
  } catch (err) {
    console.warn("Impression tracking failed", err);
  }
}

function OfferCard({ offerId, brand, description, offer, orderId }) {
  const offerUrl = orderId
    ? `${APP_BASE_URL}/r/${offerId}?orderId=${encodeURIComponent(orderId)}`
    : `${APP_BASE_URL}/r/${offerId}`;

    if (orderId) {
    trackImpression({ offerId, orderId });
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

    // Brand row
    h(
      's-stack',
      { gap: 'base', direction: 'inline', alignItems: 'center' },

      h('s-image', {
        src: 'https://placehold.co/64x64?text=Logo',
        alt: `${brand} logo`,
        width: 40,
        height: 40,
      }),

      h(
        's-stack',
        { gap: 'none' },
        h('s-text', { emphasis: true }, brand),
        h(
          's-text',
          { size: 'small', appearance: 'subdued' },
          description
        )
      )
    ),

    // Offer
    h(
      's-text',
      { emphasis: true },
      offer
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

export default function renderThankYouOffers() {
  const orderId =
    typeof shopify !== 'undefined' && shopify.order
      ? shopify.order.id
      : null;

  const App = () =>
    h(
      's-stack',
      { gap: 'base' },

      // Header
      h('s-text', { emphasis: true }, '🎉 Recommended for you'),

      // 2x2 grid
      h(
        's-grid',
        {
          gap: 'base',
          gridTemplateColumns: '1fr 1fr',
        },
        h(OfferCard, {
          offerId: 'offer_1',
          brand: 'Brand One',
          description: 'Premium cycling apparel',
          offer: '🎁 15% off your first order',
          orderId,
        }),
        h(OfferCard, {
          offerId: 'offer_2',
          brand: 'Brand Two',
          description: 'Recovery & wellness gear',
          offer: '£10 off when you spend £50',
          orderId,
        }),
        h(OfferCard, {
          offerId: 'offer_3',
          brand: 'Brand Three',
          description: 'Supplements for endurance',
          offer: '🎁 20% off sitewide',
          orderId,
        }),
        h(OfferCard, {
          offerId: 'offer_4',
          brand: 'Brand Four',
          description: 'Performance accessories',
          offer: '£5 off your next purchase',
          orderId,
        })
      )
    );

  render(h(App), document.body);
}
