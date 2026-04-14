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

// Track code reveal success
async function trackCodeRevealSuccess({ offerId, code }) {
  try {
    console.log('[track] code-reveal-success:', { offerId, code });
    // This is for local analytics; can be expanded to a real endpoint if needed
  } catch (err) {
    console.warn("Code reveal tracking failed", err);
  }
}

// Track copy code click
async function trackCopyCode({ offerId, code }) {
  try {
    console.log('[track] copy-code-click:', { offerId, code });
  } catch (err) {
    console.warn("Copy code tracking failed", err);
  }
}

// Track redirect
async function trackRedirect({ offerId, code }) {
  try {
    console.log('[track] redirect-click:', { offerId, code });
  } catch (err) {
    console.warn("Redirect tracking failed", err);
  }
}

// Convert external image URL to data URL for compatibility with Shopify Extensions
async function imageUrlToDataUrl(url) {
  if (!url) return null;
  
  // Check if already a data URL
  if (url.startsWith('data:')) {
    return url;
  }
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`Failed to convert image ${url} to data URL:`, err);
    return null;
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
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [cardState, setCardState] = useState('initial'); // initial | revealing | revealed | error
  const [discountCode, setDiscountCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedState, setCopiedState] = useState(false);
  
  // Track impression on mount
  useEffect(() => {
    if (orderId && toShopId) {
      trackImpression({ offerId, orderId, fromShopId, toShopId });
    }
  }, [offerId, orderId, fromShopId, toShopId]);
  
  // Convert image URL to data URL on mount
  useEffect(() => {
    if (logoUrl) {
      imageUrlToDataUrl(logoUrl).then((dataUrl) => {
        if (dataUrl) {
          setImageDataUrl(dataUrl);
        }
      });
    }
  }, [logoUrl]);

  const handleFirstCtaClick = async (e) => {
    e.preventDefault();
    
    // Prevent double-clicks while revealing
    if (cardState === 'revealing') return;
    
    setCardState('revealing');
    setErrorMessage(null);

    try {
      const response = await fetch(`${APP_BASE_URL}/api/activate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId,
          toShopDomain,
          fromShopDomain,
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate code');
      }

      setDiscountCode(data.code);
      setCardState('revealed');
      trackCodeRevealSuccess({ offerId, code: data.code });
      console.log('[OfferCard] code revealed:', data.code);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setErrorMessage(errorMsg);
      setCardState('error');
      console.error('[OfferCard] activation failed:', err);
    }
  };

  const handleCopyCode = async (e) => {
    e.preventDefault();
    
    if (!discountCode) return;

    try {
      // Try modern Clipboard API first
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(discountCode);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = discountCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      trackCopyCode({ offerId, code: discountCode });
      
      // Show "Copied!" state temporarily
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
      
      console.log('[OfferCard] code copied:', discountCode);
    } catch (err) {
      console.error('[OfferCard] copy failed:', err);
    }
  };

  const handleSecondCtaClick = (e) => {
    e.preventDefault();
    
    if (!discountCode) return;

    trackRedirect({ offerId, code: discountCode });
    
    // Redirect to partner shop with code in URL
    const redirectUrl = `https://${toShopDomain}/discount/${discountCode}?redirect=/`;
    window.location.href = redirectUrl;
  };

  // Determine CTA button state and text
  const getCtaProps = () => {
    if (cardState === 'revealing') {
      return {
        disabled: true,
        text: 'Loading...',
        onClick: null,
      };
    }
    
    if (cardState === 'revealed') {
      return {
        disabled: false,
        text: 'Shop now',
        onClick: handleSecondCtaClick,
      };
    }
    
    if (cardState === 'error') {
      return {
        disabled: false,
        text: 'Try again',
        onClick: handleFirstCtaClick,
      };
    }
    
    // initial state
    return {
      disabled: false,
      text: 'Unlock offer',
      onClick: handleFirstCtaClick,
    };
  };

  const ctaProps = getCtaProps();

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
          src: imageDataUrl || 'https://placehold.co/64x64?text=Logo',
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

    // Code and button group (tight spacing when revealed)
    cardState !== 'initial' && cardState !== 'revealing'
      ? h(
          's-stack',
          { gap: 'small' },
          // Revealed code section
          h(
            's-stack',
            { gap: 'none', inlineAlign: 'center' },
            h(
              's-button',
              {
                kind: 'secondary',
                onClick: handleCopyCode,
                title: 'Click to copy',
                size: 'small',
              },
              copiedState ? '✓ Copied!' : discountCode
            )
          ),
          // CTA button
          h(
            's-button',
            {
              kind: 'secondary',
              disabled: ctaProps.disabled,
              onClick: ctaProps.onClick,
              inlineSize: 'fill',
            },
            ctaProps.text
          )
        )
      : null,

    // Error message (only shown in error state)
    cardState === 'error'
      ? h(
          's-box',
          { padding: 'small' },
          h('s-text', { size: 'small', appearance: 'warning' }, 
            `Error: ${errorMessage || 'Failed to load code'}`
          )
        )
      : null,

    // CTA button (only shown in initial/error state)
    (cardState === 'initial' || cardState === 'error') && cardState !== 'revealing'
      ? h(
          's-button',
          {
            kind: cardState === 'initial' ? 'primary' : 'secondary',
            disabled: ctaProps.disabled,
            onClick: ctaProps.onClick,
            inlineSize: 'fill',
          },
          ctaProps.text
        )
      : null
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
      offersState.map((offerItem) => {
        console.log('[App] rendering offer:', { brand: offerItem.brand, logoUrl: offerItem.logoUrl });
        return h(OfferCard, {
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
        });
      })
    )
  );
}

export default function renderThankYouOffers() {
  render(h(App), document.body);
}
