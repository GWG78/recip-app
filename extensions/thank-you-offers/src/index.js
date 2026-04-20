import '@shopify/ui-extensions/preact';
import { h, render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

function resolveAppBaseUrl() {
  const explicit = typeof globalThis !== 'undefined' ? globalThis.APP_BASE_URL : null;
  if (explicit) return explicit;

  try {
    const search = globalThis?.location?.search || '';
    const params = new URLSearchParams(search);
    const devParam = params.get('dev');

    if (devParam) {
      const decoded = decodeURIComponent(devParam);
      // Shopify preview passes e.g. https://<tunnel>.trycloudflare.com/extensions
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        return decoded.replace(/\/extensions\/?$/, '');
      }
    }
  } catch (_err) {
    // Ignore parsing issues and use default.
  }

  return 'https://recip-app-5alg.onrender.com';
}

const APP_BASE_URL = resolveAppBaseUrl();

function readSignal(value) {
  if (value && typeof value === 'object') {
    if ('value' in value) return value.value;
    if ('current' in value) return value.current;
  }
  return value;
}

function normalizeDomain(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
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
    readSignal(shop?.permanentDomain),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeDomain(readSignal(candidate));
    if (normalized && normalized.includes('.myshopify.com')) {
      return normalized;
    }
  }

  return null;
}

async function trackImpression({ offerId, orderId, fromShopId, toShopId }) {
  try {
    await fetch(`${APP_BASE_URL}/api/events/impression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, orderId, fromShopId, toShopId }),
    });
  } catch (err) {
    console.warn('[track] impression failed', err);
  }
}

async function imageUrlToDataUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  try {
    const response = await fetch(url);
    if (!response.ok) return url;

    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[logo] failed to convert image URL', err);
    return url;
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
  const [imageDataUrl, setImageDataUrl] = useState(logoUrl || null);
  const [cardState, setCardState] = useState('initial');
  const [discountCode, setDiscountCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedState, setCopiedState] = useState(false);
  const [shopifySynced, setShopifySynced] = useState(true);
  const canCopyCode = Boolean(
    (typeof shopify !== 'undefined' && shopify?.clipboard?.writeText) ||
      navigator?.clipboard?.writeText
  );

  useEffect(() => {
    if (orderId && fromShopId && toShopId) {
      trackImpression({ offerId, orderId, fromShopId, toShopId });
    }
  }, [offerId, orderId, fromShopId, toShopId]);

  useEffect(() => {
    let cancelled = false;

    if (!logoUrl) {
      setImageDataUrl(null);
      return () => {
        cancelled = true;
      };
    }

    imageUrlToDataUrl(logoUrl).then((dataUrl) => {
      if (!cancelled && dataUrl) setImageDataUrl(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  const handleFirstCtaClick = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    setCardState('revealing');
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        offerId,
        toShopDomain,
        fromShopDomain: fromShopDomain || '',
        orderId: orderId || '',
      });

      const response = await fetch(`${APP_BASE_URL}/api/activate-code?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const data = await response.json();
      if (!response.ok || !data?.code) {
        throw new Error(data?.error || 'Failed to activate code');
      }

      setDiscountCode(data.code);
      setShopifySynced(data?.shopifySynced !== false);
      setCardState('revealed');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred');
      setCardState('error');
    }
  };

  const handleCopyCode = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    if (e?.stopImmediatePropagation) e.stopImmediatePropagation();

    if (!discountCode) return;
    if (!canCopyCode) return;

    try {
      if (typeof shopify !== 'undefined' && shopify?.clipboard?.writeText) {
        await shopify.clipboard.writeText(discountCode);
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(discountCode);
      }

      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      console.warn('[copy] failed', err);
    }
  };

  const redirectUrl =
    discountCode && toShopDomain
      ? `https://${toShopDomain}/discount/${discountCode}?redirect=/`
      : null;

  return h(
    's-stack',
    {
      gap: 'base',
      padding: 'base',
      border: 'base',
      borderRadius: 'base',
      inlineSize: 'fill',
    },

    h(
      's-box',
      { padding: 'none', marginBlockEnd: 'base' },
      h(
        's-stack',
        { gap: 'base', direction: 'inline', alignItems: 'start' },
        imageDataUrl
          ? h('s-image', {
              src: imageDataUrl,
              alt: `${brand} logo`,
              width: 64,
              height: 64,
            })
          : null,
        h(
          's-stack',
          { gap: 'none' },
          h('s-text', { emphasis: true, size: 'large' }, brand),
          h('s-text', { size: 'small', appearance: 'subdued' }, offer)
        )
      )
    ),

    h('s-text', { appearance: 'subdued' }, description),

    cardState !== 'initial' && cardState !== 'revealing'
      ? h(
          's-stack',
          { gap: 'small' },
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
                disabled: !canCopyCode,
              },
              !canCopyCode ? `Code: ${discountCode}` : copiedState ? 'Copied!' : discountCode
            )
          ),
          cardState === 'revealed'
            ? h(
                's-link',
                {
                  to: redirectUrl,
                  external: true,
                },
                'Shop now'
              )
            : null,
          cardState === 'revealed' && !shopifySynced
            ? h(
                's-text',
                { size: 'small', appearance: 'warning' },
                'Code is generated, but not synced to Shopify yet. It may not redeem until shop auth is fixed.'
              )
            : null
        )
      : null,

    cardState === 'revealing'
      ? h(
          's-box',
          { padding: 'small' },
          h(
            's-text',
            { size: 'small', appearance: 'subdued' },
            'Generating your discount code...'
          )
        )
      : null,

    cardState === 'error'
      ? h(
          's-box',
          { padding: 'small' },
          h('s-text', { size: 'small', appearance: 'warning' }, `Error: ${errorMessage || 'Failed to load code'}`)
        )
      : null,

    cardState === 'initial' || cardState === 'error'
      ? h(
          's-button',
          {
            kind: cardState === 'initial' ? 'primary' : 'secondary',
            onClick: handleFirstCtaClick,
            inlineSize: 'fill',
          },
          cardState === 'initial' ? 'Unlock offer' : 'Try again'
        )
      : null
  );
}

function App() {
  const orderApi = typeof shopify !== 'undefined' ? shopify.order : null;
  const shopApi = typeof shopify !== 'undefined' ? shopify.shop : null;

  const orderId = useMemo(() => {
    const order = readSignal(orderApi);
    return order?.id ? String(readSignal(order.id)) : null;
  }, [orderApi]);

  const fromShopDomain = useMemo(() => {
    const resolved = resolveShopDomain(shopApi);
    const fallback = normalizeDomain(globalThis.location?.hostname || '');
    const domain = resolved || (fallback.includes('.myshopify.com') ? fallback : null);
    console.log('[thank-you-offers] fromShopDomain:', domain, 'shopApi:', readSignal(shopApi), 'location.hostname:', globalThis.location?.hostname || '');
    return domain;
  }, [shopApi]);

  const [offersState, setOffersState] = useState([]);
  const [sourceShopId, setSourceShopId] = useState(null);

  useEffect(() => {
    async function loadOffers() {
      const requestedShop = normalizeDomain(fromShopDomain || '');
      console.log('[thank-you-offers] loadOffers requestedShop:', requestedShop, 'base:', APP_BASE_URL);

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
        console.warn('Failed to load offers', err);
        setOffersState([]);
        setSourceShopId(null);
      }
    }

    loadOffers();
  }, [fromShopDomain]);

  return h(
    's-stack',
    { gap: 'base' },
    h('s-text', { emphasis: true }, 'Recommended for you'),
    offersState.length === 0 ? h('s-text', { appearance: 'subdued' }, 'No partner offers available yet') : null,
    h(
      's-grid',
      { gap: 'base', gridTemplateColumns: '1fr 1fr' },
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
        })
      )
    )
  );
}

export default function renderThankYouOffers() {
  render(h(App), document.body);
}
