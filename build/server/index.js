var _a;
import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter, UNSAFE_withComponentProps, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useActionData, Form, useLocation, UNSAFE_withErrorBoundaryProps, useRouteError } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import "@shopify/shopify-app-react-router/adapters/node";
import { shopifyApp, AppDistribution, ApiVersion, LoginErrorType, boundary } from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient, ReferralEventType } from "@prisma/client";
import { randomBytes } from "crypto";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import { AppProvider as AppProvider$1, Page, Layout, Text, Card, TextField, ChoiceList, Checkbox, Banner, Button, Thumbnail } from "@shopify/polaris";
import { readFile } from "node:fs/promises";
import path from "node:path";
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}
const prisma = global.prismaGlobal ?? new PrismaClient();
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
ApiVersion.October25;
const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
shopify.unauthenticated;
const login = shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
const streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, reactRouterContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        ServerRouter,
        {
          context: reactRouterContext,
          url: request.url
        }
      ),
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width,initial-scale=1"
      }), /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://cdn.shopify.com/"
      }), /* @__PURE__ */ jsx("link", {
        rel: "stylesheet",
        href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: root
}, Symbol.toStringTag, { value: "Module" }));
const action$8 = async ({
  request
}) => {
  const {
    payload,
    session,
    topic,
    shop
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;
  if (session) {
    await prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        scope: current.toString()
      }
    });
  }
  return new Response();
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8
}, Symbol.toStringTag, { value: "Module" }));
const action$7 = async ({
  request
}) => {
  const {
    shop,
    session,
    topic
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  if (session) {
    await prisma.session.deleteMany({
      where: {
        shop
      }
    });
  }
  return new Response();
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7
}, Symbol.toStringTag, { value: "Module" }));
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7
}, Symbol.toStringTag, { value: "Module" }));
function buildSheetsUrl(baseUrl, apiKey) {
  const missing = [];
  if (!baseUrl) missing.push("Google Sheets URL");
  if (!apiKey) missing.push("Google Sheets API key");
  if (missing.length) {
    console.warn(`⚠️ Sheets sync skipped: missing ${missing.join(" and ")}`);
    return null;
  }
  return `${baseUrl}?api_key=${apiKey}`;
}
async function postToSheets(baseUrl, payload) {
  const endpoint = buildSheetsUrl(baseUrl, process.env.GOOGLE_SHEETS_API_KEY);
  if (!endpoint) {
    console.warn("Sheets sync skipped: endpoint missing");
    return false;
  }
  console.log("[Sheets] POST", { endpoint, payload });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("[Sheets] POST failed", { endpoint, status: response.status, statusText: response.statusText, body });
    throw new Error(`${response.status} ${response.statusText} - ${body}`);
  }
  console.log("[Sheets] POST success", { endpoint, status: response.status });
  return true;
}
async function sendFriendlyBrandLead(args) {
  try {
    await postToSheets(process.env.GOOGLE_SHEETS_FRIENDLY_BRANDS_URL, {
      sheetName: process.env.FRIENDLY_BRANDS_SHEET_NAME || "FriendlyBrandLeads",
      fromShopDomain: args.fromShopDomain,
      fromShopName: args.fromShopName || args.fromShopDomain,
      enteredBrandDomain: args.enteredBrandDomain
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Friendly-brand Sheets sync failed:", message);
  }
}
async function sendInstallLead(args) {
  try {
    await postToSheets(
      process.env.GOOGLE_SHEETS_INSTALLS_URL || process.env.GOOGLE_SHEETS_FRIENDLY_BRANDS_URL,
      {
        sheetName: process.env.INSTALLS_SHEET_NAME || "Installs",
        shopDomain: args.shopDomain,
        installedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Install Sheets sync failed:", message);
  }
}
async function sendReferralEventRow(args) {
  try {
    await postToSheets(
      process.env.GOOGLE_SHEETS_REFERRAL_EVENTS_URL || process.env.GOOGLE_SHEETS_FRIENDLY_BRANDS_URL,
      {
        sheetName: process.env.REFERRAL_EVENTS_SHEET_NAME || "ReferralEvents",
        ...args
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ ReferralEvents Sheets sync failed:", message);
  }
}
const DEFAULT_POOL_SIZE = 3;
const DEFAULT_EXPIRY_HOURS = 72;
const SHOPIFY_API_VERSION = "2025-10";
const CREATE_DISCOUNT_CODE_MUTATION = `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
      codeDiscount {
        ... on DiscountCodeBasic {
          title
        }
      }
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;
function generateCode(prefix) {
  return `${prefix}${randomBytes(3).toString("hex").toUpperCase()}`;
}
function buildValueInput(discountKind, discountValue) {
  if (discountKind === "FIXED") {
    return {
      discountAmount: {
        amount: discountValue.toFixed(2),
        appliesOnEachItem: false
      }
    };
  }
  return { percentage: discountValue / 100 };
}
async function resolveAdminClient(toShopId, injectedClient) {
  if (injectedClient) return injectedClient;
  const shop = await prisma.shop.findUnique({
    where: { id: toShopId },
    select: { shopDomain: true, accessToken: true }
  });
  if (!(shop == null ? void 0 : shop.shopDomain) || !shop.accessToken) {
    throw new Error(
      `Missing shop credentials for toShopId=${toShopId}; pass adminClient or persist shop token`
    );
  }
  const accessToken = shop.accessToken;
  return {
    graphql: async (query, options) => {
      const response = await fetch(
        `https://${shop.shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken
          },
          body: JSON.stringify({
            query,
            variables: (options == null ? void 0 : options.variables) ?? {}
          })
        }
      );
      return response;
    }
  };
}
async function createShopifyDiscountCode(args) {
  var _a2, _b, _c;
  const startsAt = /* @__PURE__ */ new Date();
  const defaultExpiryHours = args.expiryHours ?? 365 * 24;
  const endsAt = new Date(startsAt.getTime() + defaultExpiryHours * 60 * 60 * 1e3);
  const variables = {
    basicCodeDiscount: {
      title: args.code,
      code: args.code,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value: buildValueInput(args.discountKind, args.discountValue),
        items: { all: true }
      },
      appliesOncePerCustomer: true,
      usageLimit: 1
    }
  };
  const response = await args.adminClient.graphql(CREATE_DISCOUNT_CODE_MUTATION, {
    variables
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify API HTTP ${response.status}: ${body}`);
  }
  const payload = await response.json();
  if ((_a2 = payload.errors) == null ? void 0 : _a2.length) {
    throw new Error(payload.errors.map((e) => e.message).join("; "));
  }
  const result = (_b = payload.data) == null ? void 0 : _b.discountCodeBasicCreate;
  const userErrors = (result == null ? void 0 : result.userErrors) ?? [];
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).filter(Boolean).join("; "));
  }
  const gid = (_c = result == null ? void 0 : result.codeDiscountNode) == null ? void 0 : _c.id;
  if (!gid) {
    throw new Error("Shopify response missing codeDiscountNode.id");
  }
  return {
    gid,
    code: args.code,
    startsAt,
    endsAt
  };
}
async function ensureDiscountPool(toShopId, options = {}) {
  const settings = await prisma.shopSettings.findUnique({
    where: { shopId: toShopId },
    select: { discountType: true, discountValue: true }
  });
  const settingsDiscountType = (settings == null ? void 0 : settings.discountType) ?? "PERCENTAGE";
  const rawSettingsValue = (settings == null ? void 0 : settings.discountValue) ? Number(settings.discountValue) : 10;
  const settingsDiscountValue = settingsDiscountType === "PERCENTAGE" && rawSettingsValue <= 1 ? rawSettingsValue * 100 : rawSettingsValue;
  const poolSize = options.poolSize ?? DEFAULT_POOL_SIZE;
  const prefix = options.prefix ?? "RECIP";
  options.expiryHours ?? DEFAULT_EXPIRY_HOURS;
  const discountKind = options.discountKind ?? settingsDiscountType;
  const discountValue = options.discountValue ?? settingsDiscountValue;
  const adminClient = await resolveAdminClient(toShopId, options.adminClient);
  const initialPool = await prisma.discountCode.count({
    where: { toShopId, state: "POOL" }
  });
  console.log(
    `[pool] toShopId=${toShopId} current=${initialPool} target=${poolSize}`
  );
  if (initialPool >= poolSize) {
    console.log(`[pool] toShopId=${toShopId} already full`);
    return { created: 0, poolSize: initialPool };
  }
  const createdCodes = [];
  const targetMissing = poolSize - initialPool;
  for (let i = 0; i < targetMissing; i += 1) {
    const currentPool = await prisma.discountCode.count({
      where: { toShopId, state: "POOL" }
    });
    if (currentPool >= poolSize) break;
    const code = generateCode(prefix);
    const generatedGid = `gid://shopify/DiscountCode/${code}`;
    try {
      const shopifyResult = await createShopifyDiscountCode({
        adminClient,
        code,
        discountKind,
        discountValue
        // Don't pass expiryHours for pool codes - they should last indefinitely
      });
      await prisma.discountCode.create({
        data: {
          toShopId,
          code: shopifyResult.code,
          shopifyDiscountGid: shopifyResult.gid,
          state: "POOL",
          startsAt: shopifyResult.startsAt,
          endsAt: shopifyResult.endsAt
        }
      });
      createdCodes.push(code);
      console.log(`[pool] toShopId=${toShopId} created ${code} (Shopify)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pool] toShopId=${toShopId} failed creating code ${code} in Shopify: ${message}`);
      try {
        const now = /* @__PURE__ */ new Date();
        const endsAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1e3);
        await prisma.discountCode.create({
          data: {
            toShopId,
            code,
            shopifyDiscountGid: generatedGid,
            state: "POOL",
            startsAt: now,
            endsAt
          }
        });
        createdCodes.push(code);
        console.log(`[pool] toShopId=${toShopId} created ${code} (DB only, Shopify access not available)`);
      } catch (dbError) {
        const dbMessage = dbError instanceof Error ? dbError.message : String(dbError);
        console.error(`[pool] toShopId=${toShopId} failed creating DB record for ${code}: ${dbMessage}`);
      }
    }
  }
  const finalPool = await prisma.discountCode.count({
    where: { toShopId, state: "POOL" }
  });
  console.log(
    `[pool] toShopId=${toShopId} final=${finalPool} created=${createdCodes.length} codes=${createdCodes.join(",") || "-"}`
  );
  return { created: createdCodes.length, poolSize: finalPool, codes: createdCodes };
}
function extractOrderDiscountCodes(payload) {
  var _a2, _b;
  const fromDiscountCodes = ((_a2 = payload.discount_codes) == null ? void 0 : _a2.map((d) => {
    var _a3;
    return (_a3 = d.code) == null ? void 0 : _a3.trim();
  }).filter((code) => Boolean(code))) ?? [];
  const fromApplications = ((_b = payload.discount_applications) == null ? void 0 : _b.filter((d) => d.type === "discount_code").map((d) => {
    var _a3;
    return (_a3 = d.code) == null ? void 0 : _a3.trim();
  }).filter((code) => Boolean(code))) ?? [];
  return [.../* @__PURE__ */ new Set([...fromDiscountCodes, ...fromApplications])];
}
const action$6 = async ({
  request
}) => {
  var _a2, _b;
  const {
    payload,
    topic,
    shop,
    admin
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  const order = payload;
  const usedCodes = extractOrderDiscountCodes(order);
  if (!usedCodes.length) {
    console.log(`[orders/create] no discount codes on order for ${shop}`);
    return new Response();
  }
  const matched = await prisma.discountCode.findFirst({
    where: {
      code: {
        in: usedCodes
      },
      toShop: {
        shopDomain: shop
      }
    },
    orderBy: {
      activatedAt: "desc"
    }
  });
  if (!matched) {
    console.log(`[orders/create] no matching Recip code found for ${shop}. used=${usedCodes.join(",")}`);
    return new Response();
  }
  const orderId = order.id ? String(order.id) : null;
  const orderAmount = typeof order.total_price !== "undefined" ? String(order.total_price) : null;
  const lineItemCount = Array.isArray(order.line_items) ? order.line_items.length : null;
  await prisma.discountCode.update({
    where: {
      id: matched.id
    },
    data: {
      state: "REDEEMED",
      redeemedAt: /* @__PURE__ */ new Date(),
      orderId,
      orderAmount,
      lineItemCount
    }
  });
  const clickEvent = await prisma.referralEvent.findFirst({
    where: {
      discountCodeId: matched.id,
      type: "CLICK"
    },
    orderBy: {
      timestamp: "desc"
    },
    include: {
      fromShop: {
        select: {
          shopDomain: true
        }
      },
      toShop: {
        select: {
          shopDomain: true
        }
      }
    }
  });
  const meta = (clickEvent == null ? void 0 : clickEvent.meta) ?? null;
  await sendReferralEventRow({
    event_id: `${matched.id}:${orderId ?? Date.now().toString()}`,
    event_type: "ORDER_CREATED",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    from_shop_domain: ((_a2 = clickEvent == null ? void 0 : clickEvent.fromShop) == null ? void 0 : _a2.shopDomain) ?? null,
    to_shop_domain: ((_b = clickEvent == null ? void 0 : clickEvent.toShop) == null ? void 0 : _b.shopDomain) ?? shop,
    offer_id: (meta == null ? void 0 : meta.offerId) ?? null,
    discount_code: matched.code,
    discount_code_id: matched.id,
    discount_state: "REDEEMED",
    order_id: orderId,
    order_number: order.order_number ? String(order.order_number) : null,
    order_currency: order.currency || order.presentment_currency || null,
    order_total: orderAmount,
    line_item_count: lineItemCount,
    user_agent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    environment: process.env.NODE_ENV || null
  });
  console.log(`[orders/create] marked REDEEMED code=${matched.code} shop=${shop} orderId=${orderId ?? "-"}`);
  try {
    await ensureDiscountPool(matched.toShopId, {
      adminClient: admin ? {
        graphql: admin.graphql.bind(admin)
      } : void 0
    });
    console.log(`[orders/create] pool ensure triggered for toShopId=${matched.toShopId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[orders/create] pool ensure failed for toShopId=${matched.toShopId}: ${message}`);
  }
  return new Response();
};
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6
}, Symbol.toStringTag, { value: "Module" }));
async function action$5({
  request
}) {
  var _a2, _b;
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const body = await request.json();
  const {
    offerId,
    orderId,
    fromShopId,
    toShopId
  } = body;
  if (!offerId || !orderId || !toShopId) {
    return Response.json({
      error: "Missing required fields"
    }, {
      status: 400
    });
  }
  const existing = await prisma.referralEvent.findFirst({
    where: {
      type: ReferralEventType.IMPRESSION,
      toShopId,
      meta: {
        path: ["offerId"],
        equals: offerId
      },
      AND: {
        meta: {
          path: ["orderId"],
          equals: orderId
        }
      }
    }
  });
  if (existing) {
    return Response.json({
      ok: true,
      deduped: true
    });
  }
  const event = await prisma.referralEvent.create({
    data: {
      type: ReferralEventType.IMPRESSION,
      fromShopId: fromShopId ?? toShopId,
      // safe default
      toShopId,
      meta: {
        offerId,
        orderId
      }
    },
    include: {
      fromShop: {
        select: {
          shopDomain: true
        }
      },
      toShop: {
        select: {
          shopDomain: true
        }
      }
    }
  });
  try {
    await sendReferralEventRow({
      event_id: event.id,
      event_type: "IMPRESSION",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      from_shop_domain: ((_a2 = event.fromShop) == null ? void 0 : _a2.shopDomain) ?? null,
      to_shop_domain: ((_b = event.toShop) == null ? void 0 : _b.shopDomain) ?? null,
      offer_id: offerId,
      discount_code: null,
      discount_code_id: null,
      discount_state: null,
      order_id: orderId,
      order_number: null,
      order_currency: null,
      order_total: null,
      line_item_count: null,
      user_agent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      environment: process.env.NODE_ENV || null
    });
  } catch (error) {
    console.error(`[api/events/impression] failed to sync to sheets: ${error.message}`);
  }
  return Response.json({
    ok: true
  });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5
}, Symbol.toStringTag, { value: "Module" }));
const loader$b = async ({
  request
}) => {
  console.log("[friendly-brands] GET", request.url);
  const {
    session
  } = await authenticate.admin(request);
  console.log("[friendly-brands] shop", session.shop);
  const shop = await prisma.shop.upsert({
    where: {
      shopDomain: session.shop
    },
    update: {},
    create: {
      shopDomain: session.shop
    }
  });
  const brands = await prisma.friendlyBrand.findMany({
    where: {
      shopId: shop.id
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return Response.json(brands);
};
const action$4 = async ({
  request
}) => {
  console.log("[friendly-brands] POST", request.url);
  const {
    session
  } = await authenticate.admin(request);
  console.log("[friendly-brands] shop", session.shop);
  const shop = await prisma.shop.upsert({
    where: {
      shopDomain: session.shop
    },
    update: {},
    create: {
      shopDomain: session.shop
    }
  });
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const body = await request.json();
  console.log("[friendly-brands] body", body);
  const brandDomain = String((body == null ? void 0 : body.brandDomain) || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!brandDomain) {
    return Response.json({
      error: "brandDomain is required"
    }, {
      status: 400
    });
  }
  const created = await prisma.friendlyBrand.create({
    data: {
      shopId: shop.id,
      brandDomain
    }
  });
  console.log("[friendly-brands] created", created.id);
  await sendFriendlyBrandLead({
    fromShopDomain: shop.shopDomain,
    fromShopName: shop.shopDomain,
    enteredBrandDomain: brandDomain
  });
  return Response.json(created, {
    status: 201
  });
};
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
const action$3 = async ({
  request,
  params
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const shop = await prisma.shop.upsert({
    where: {
      shopDomain: session.shop
    },
    update: {},
    create: {
      shopDomain: session.shop
    }
  });
  if (request.method !== "DELETE") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const id = params.id;
  if (!id) {
    return Response.json({
      error: "Missing id"
    }, {
      status: 400
    });
  }
  await prisma.friendlyBrand.deleteMany({
    where: {
      id,
      shopId: shop.id
    }
  });
  return Response.json({
    ok: true
  });
};
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$a = async ({
  request
}) => {
  await authenticate.admin(request);
  return Response.json({
    ok: true
  });
};
const action$2 = async ({
  request
}) => {
  var _a2, _b, _c;
  const {
    session
  } = await authenticate.admin(request);
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const body = await request.json();
  const brandName = (_a2 = body.brandName) == null ? void 0 : _a2.trim();
  const websiteUrl = (_b = body.websiteUrl) == null ? void 0 : _b.trim();
  const description = (_c = body.description) == null ? void 0 : _c.trim();
  if (!brandName) {
    return Response.json({
      error: "Brand name is required."
    }, {
      status: 400
    });
  }
  if (!websiteUrl) {
    return Response.json({
      error: "Website URL is required."
    }, {
      status: 400
    });
  }
  if (!description) {
    return Response.json({
      error: "Description is required."
    }, {
      status: 400
    });
  }
  if (!body.monthlyVolume) {
    return Response.json({
      error: "Monthly order volume is required."
    }, {
      status: 400
    });
  }
  console.log("[onboarding] shop=", session.shop, {
    brandName,
    websiteUrl,
    description,
    productUrls: body.productUrls,
    monthlyVolume: body.monthlyVolume,
    friendlyBrands: body.friendlyBrands,
    newCustomersOnly: Boolean(body.newCustomersOnly),
    participateNetwork: Boolean(body.participateNetwork)
  });
  return Response.json({
    ok: true
  });
};
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
const loader$9 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const shop = await prisma.shop.upsert({
    where: {
      shopDomain: session.shop
    },
    update: {},
    create: {
      shopDomain: session.shop
    }
  });
  const settings = await prisma.shopSettings.upsert({
    where: {
      shopId: shop.id
    },
    update: {},
    create: {
      shopId: shop.id
    }
  });
  return Response.json(settings);
};
const action$1 = async ({
  request
}) => {
  const {
    session,
    admin
  } = await authenticate.admin(request);
  const shop = await prisma.shop.upsert({
    where: {
      shopDomain: session.shop
    },
    update: {},
    create: {
      shopDomain: session.shop
    }
  });
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const body = await request.json();
  const current = await prisma.shopSettings.findUnique({
    where: {
      shopId: shop.id
    },
    select: {
      discountType: true
    }
  });
  const updateData = {};
  if (typeof (body == null ? void 0 : body.active) !== "undefined") {
    updateData.active = Boolean(body.active);
  }
  if (typeof (body == null ? void 0 : body.discountType) !== "undefined") {
    if (body.discountType !== "PERCENTAGE" && body.discountType !== "FIXED") {
      return Response.json({
        error: "Invalid discountType"
      }, {
        status: 400
      });
    }
    updateData.discountType = body.discountType;
  }
  if (typeof (body == null ? void 0 : body.discountValue) !== "undefined") {
    const parsedValue = Number(body.discountValue);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return Response.json({
        error: "discountValue must be greater than 0"
      }, {
        status: 400
      });
    }
    const effectiveDiscountType = updateData.discountType ?? (current == null ? void 0 : current.discountType) ?? "PERCENTAGE";
    if (effectiveDiscountType === "PERCENTAGE" && parsedValue > 100) {
      return Response.json({
        error: "Percentage discount cannot exceed 100"
      }, {
        status: 400
      });
    }
    updateData.discountValue = parsedValue;
  }
  if (Object.keys(updateData).length === 0) {
    return Response.json({
      error: "No settings provided"
    }, {
      status: 400
    });
  }
  const settings = await prisma.shopSettings.upsert({
    where: {
      shopId: shop.id
    },
    update: updateData,
    create: {
      shopId: shop.id,
      active: updateData.active ?? true,
      discountType: updateData.discountType ?? "PERCENTAGE",
      discountValue: updateData.discountValue ?? 10
    }
  });
  const discountChanged = typeof updateData.discountType !== "undefined" || typeof updateData.discountValue !== "undefined";
  if (discountChanged) {
    await prisma.discountCode.updateMany({
      where: {
        toShopId: shop.id,
        state: "POOL"
      },
      data: {
        state: "VOID"
      }
    });
    await ensureDiscountPool(shop.id, {
      adminClient: {
        graphql: admin.graphql.bind(admin)
      }
    });
  }
  return Response.json(settings);
};
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
function normalizeDomain(value) {
  return value.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}
function buildOfferText(discountType, discountValue) {
  if (discountType === "FIXED") {
    return `Save ${discountValue.toFixed(2)} on your next order`;
  }
  return `${discountValue}% off your next order`;
}
const loader$8 = async ({
  request
}) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  const url = new URL(request.url);
  const rawShop = url.searchParams.get("shop");
  if (!rawShop) {
    return Response.json({
      error: "Missing shop parameter"
    }, {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  const sourceDomain = normalizeDomain(rawShop);
  console.log(`[offers] request shop=${sourceDomain}`);
  const sourceShop = await prisma.shop.findUnique({
    where: {
      shopDomain: sourceDomain
    },
    include: {
      friendly: true
    }
  });
  if (!sourceShop) {
    console.log(`[offers] source shop not found for ${sourceDomain}`);
    return Response.json({
      sourceShopId: null,
      offers: []
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  const domains = sourceShop.friendly.map((b) => b.brandDomain);
  if (!domains.length) {
    console.log(`[offers] no friendly brands for ${sourceDomain}`);
    return Response.json({
      sourceShopId: sourceShop.id,
      offers: []
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  const destinationShops = await prisma.shop.findMany({
    where: {
      shopDomain: {
        in: domains
      },
      installed: true,
      active: true
    },
    include: {
      settings: {
        select: {
          discountType: true,
          discountValue: true
        }
      }
    },
    take: 4
  });
  console.log(`[offers] destinationShops found: ${destinationShops.length}`);
  destinationShops.forEach((shop) => {
    console.log(`[offers] dest shop: ${shop.shopDomain}, installed: ${shop.installed}, active: ${shop.active}`);
  });
  const offers = destinationShops.map((shop) => {
    var _a2, _b;
    const discountType = ((_a2 = shop.settings) == null ? void 0 : _a2.discountType) ?? "PERCENTAGE";
    const discountValue = Number(((_b = shop.settings) == null ? void 0 : _b.discountValue) ?? 10);
    return {
      offerId: `offer-${shop.id}`,
      toShopId: shop.id,
      toShopDomain: shop.shopDomain,
      brand: shop.shopDomain.replace(".myshopify.com", ""),
      description: "Partner offer",
      offer: buildOfferText(discountType, discountValue),
      discountType,
      discountValue
    };
  });
  console.log(`[offers] source=${sourceDomain} friendly=${domains.length} matched=${offers.length}`);
  return Response.json({
    sourceShopId: sourceShop.id,
    offers
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
};
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
function loginErrorMessage(loginErrors) {
  if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  return {};
}
const loader$7 = async ({
  request
}) => {
  const errors = loginErrorMessage(await login(request));
  return {
    errors
  };
};
const action = async ({
  request
}) => {
  const errors = loginErrorMessage(await login(request));
  return {
    errors
  };
};
const route$1 = UNSAFE_withComponentProps(function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const {
    errors
  } = actionData || loaderData;
  return /* @__PURE__ */ jsx(AppProvider, {
    embedded: false,
    children: /* @__PURE__ */ jsx("s-page", {
      children: /* @__PURE__ */ jsx(Form, {
        method: "post",
        children: /* @__PURE__ */ jsxs("s-section", {
          heading: "Log in",
          children: [/* @__PURE__ */ jsx("s-text-field", {
            name: "shop",
            label: "Shop domain",
            details: "example.myshopify.com",
            value: shop,
            onChange: (e) => setShop(e.currentTarget.value || ""),
            autocomplete: "on",
            error: errors.shop
          }), /* @__PURE__ */ jsx("s-button", {
            type: "submit",
            children: "Log in"
          })]
        })
      })
    })
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: route$1,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function trackEventTx(tx, {
  type,
  fromShopId,
  toShopId,
  discountCodeId = null,
  meta = {}
}) {
  return tx.referralEvent.create({
    data: {
      type,
      fromShopId,
      toShopId,
      discountCodeId,
      meta
    }
  });
}
const EXPIRY_HOURS = 72;
const UPDATE_DISCOUNT_MUTATION = `
mutation discountCodeBasicUpdate($id: ID!, $basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicUpdate(id: $id, basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;
async function updateShopifyDiscount(adminClient, discountGid, startsAt, endsAt) {
  var _a2, _b;
  const response = await adminClient.graphql(UPDATE_DISCOUNT_MUTATION, {
    variables: {
      id: discountGid,
      basicCodeDiscount: {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString()
      }
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify API HTTP ${response.status}: ${body}`);
  }
  const payload = await response.json();
  if ((_a2 = payload.errors) == null ? void 0 : _a2.length) {
    throw new Error(payload.errors.map((e) => e.message).join("; "));
  }
  const result = (_b = payload.data) == null ? void 0 : _b.discountCodeBasicUpdate;
  const userErrors = (result == null ? void 0 : result.userErrors) ?? [];
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).filter(Boolean).join("; "));
  }
}
async function activateDiscountFromPool({
  fromShopId,
  toShopId,
  offerId,
  orderId,
  expiryHours = EXPIRY_HOURS,
  adminClient
}) {
  var _a2;
  if (adminClient) {
    try {
      await ensureDiscountPool(toShopId, { adminClient });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pool] failed to ensure pool for toShopId=${toShopId}: ${message}`);
    }
  }
  const now = /* @__PURE__ */ new Date();
  const endsAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1e3);
  const activatedCode = await prisma.$transaction(async (tx) => {
    const poolCode = await tx.discountCode.findFirst({
      where: {
        toShopId,
        state: "POOL"
      },
      orderBy: { createdAt: "asc" }
    });
    if (!poolCode) {
      throw new Error("No discount codes available");
    }
    const activatedCode2 = await tx.discountCode.update({
      where: { id: poolCode.id },
      data: {
        state: "ACTIVE",
        activatedAt: now,
        startsAt: now,
        endsAt
      }
    });
    await trackEventTx(tx, {
      type: "CLICK",
      fromShopId: fromShopId ?? toShopId,
      toShopId,
      discountCodeId: activatedCode2.id,
      meta: {
        offerId,
        orderId
      }
    });
    return activatedCode2;
  });
  if (adminClient) {
    try {
      await updateShopifyDiscount(
        adminClient,
        activatedCode.shopifyDiscountGid,
        activatedCode.startsAt,
        activatedCode.endsAt
      );
      console.log(`[activation] updated Shopify discount ${activatedCode.code}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[activation] failed to update Shopify discount ${activatedCode.code}: ${message}`);
    }
  } else {
    console.log(`[activation] skipping Shopify update for ${activatedCode.code} (no admin access)`);
  }
  if (adminClient) {
    try {
      const replenishResult = await ensureDiscountPool(toShopId, { adminClient });
      console.log(
        `[pool] replenish after click toShopId=${toShopId} created=${replenishResult.created} poolSize=${replenishResult.poolSize}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pool] replenish after activation failed toShopId=${toShopId}: ${message}`);
    }
  } else {
    console.log(`[pool] skipping replenish for toShopId=${toShopId} (no admin access)`);
  }
  try {
    const toShop = await prisma.shop.findUnique({
      where: { id: toShopId },
      select: { shopDomain: true }
    });
    const fromShop = fromShopId ? await prisma.shop.findUnique({
      where: { id: fromShopId },
      select: { shopDomain: true }
    }) : null;
    await sendReferralEventRow({
      event_id: activatedCode.id,
      event_type: "CLICK",
      timestamp: ((_a2 = activatedCode.activatedAt) == null ? void 0 : _a2.toISOString()) || (/* @__PURE__ */ new Date()).toISOString(),
      from_shop_domain: (fromShop == null ? void 0 : fromShop.shopDomain) ?? null,
      to_shop_domain: (toShop == null ? void 0 : toShop.shopDomain) ?? null,
      offer_id: offerId,
      discount_code: activatedCode.code,
      discount_code_id: activatedCode.id,
      discount_state: "ACTIVE",
      order_id: orderId ?? null,
      order_number: null,
      order_currency: null,
      order_total: null,
      line_item_count: null,
      user_agent: null,
      referer: null,
      environment: process.env.NODE_ENV || null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[activation] failed to sync CLICK event to sheets: ${message}`);
  }
  return activatedCode;
}
async function loader$6({
  params,
  request
}) {
  const offerId = params.offerId;
  if (!offerId) {
    throw new Response("Offer not found", {
      status: 404
    });
  }
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const toShopDomain = url.searchParams.get("toShopDomain");
  const fromShopDomain = url.searchParams.get("fromShopDomain");
  if (!toShopDomain) {
    throw new Response("Missing destination shop", {
      status: 400
    });
  }
  const toShop = await prisma.shop.findUnique({
    where: {
      shopDomain: toShopDomain
    },
    select: {
      id: true,
      shopDomain: true
    }
  });
  if (!toShop) {
    throw new Response("Destination shop not found", {
      status: 404
    });
  }
  const fromShop = fromShopDomain ? await prisma.shop.findUnique({
    where: {
      shopDomain: fromShopDomain
    },
    select: {
      id: true
    }
  }) : null;
  let adminClient;
  try {
    adminClient = await resolveAdminClient(toShop.id);
  } catch (error) {
    console.log(`[r/${offerId}] no admin access for destination shop ${toShopDomain}, skipping Shopify updates`);
  }
  const discount = await activateDiscountFromPool({
    toShopId: toShop.id,
    fromShopId: fromShop == null ? void 0 : fromShop.id,
    offerId,
    orderId,
    adminClient
    // This will be undefined if resolveAdminClient failed
  });
  const redirectUrl = `https://${toShop.shopDomain}/discount/${discount.code}?redirect=/`;
  return Response.redirect(redirectUrl);
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = async ({
  request
}) => {
  await authenticate.admin(request);
  return Response.json({});
};
const route = UNSAFE_withComponentProps(function Home() {
  const location = useLocation();
  const search = location.search || "";
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: 40,
      maxWidth: 980,
      margin: "0 auto",
      fontFamily: "Inter, sans-serif"
    },
    children: [/* @__PURE__ */ jsx("h1", {
      style: {
        fontSize: 36,
        marginBottom: 16
      },
      children: "Welcome to Recip"
    }), /* @__PURE__ */ jsx("p", {
      style: {
        fontSize: 18,
        lineHeight: 1.7,
        marginBottom: 24
      },
      children: "This is your home landing page. Use the onboarding flow to connect your brand and configure your first partner offers."
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
      },
      children: [/* @__PURE__ */ jsx("a", {
        href: `/app/onboarding${search}`,
        style: {
          display: "inline-block",
          padding: "12px 20px",
          borderRadius: 10,
          background: "#00695c",
          color: "white",
          textDecoration: "none",
          fontWeight: 600
        },
        children: "Go to onboarding"
      }), /* @__PURE__ */ jsx("a", {
        href: `/app/additional${search}`,
        style: {
          display: "inline-block",
          padding: "12px 20px",
          borderRadius: 10,
          background: "#f4f6f8",
          color: "#111827",
          textDecoration: "none",
          fontWeight: 600
        },
        children: "View additional page"
      })]
    })]
  });
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: route,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const loader$4 = async ({
  request
}) => {
  await authenticate.admin(request);
  return null;
};
const headers$1 = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  headers: headers$1,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const loader$3 = async ({
  request
}) => {
  let apiKey = process.env.SHOPIFY_API_KEY || "";
  try {
    const {
      session,
      admin
    } = await authenticate.admin(request);
    const adminClient = {
      graphql: admin.graphql.bind(admin)
    };
    const sessionAccessToken = session.accessToken ?? null;
    const sessionScope = session.scope ?? null;
    const existingShop = await prisma.shop.findUnique({
      where: {
        shopDomain: session.shop
      }
    });
    if (!existingShop) {
      const createdShop = await prisma.shop.create({
        data: {
          shopDomain: session.shop,
          installed: true,
          uninstalledAt: null,
          accessToken: sessionAccessToken,
          scope: sessionScope
        }
      });
      await sendInstallLead({
        shopDomain: session.shop
      });
      await ensureDiscountPool(createdShop.id, {
        adminClient
      });
    } else {
      await prisma.shop.update({
        where: {
          id: existingShop.id
        },
        data: {
          ...sessionAccessToken ? {
            accessToken: sessionAccessToken
          } : {},
          ...sessionScope ? {
            scope: sessionScope
          } : {},
          ...!existingShop.installed || existingShop.uninstalledAt ? {
            installed: true,
            uninstalledAt: null
          } : {}
        }
      });
      if (!existingShop.installed || existingShop.uninstalledAt) {
        await sendInstallLead({
          shopDomain: session.shop
        });
        await ensureDiscountPool(existingShop.id, {
          adminClient
        });
      }
    }
  } catch {
  }
  return {
    apiKey
  };
};
const app = UNSAFE_withComponentProps(function App2() {
  const {
    apiKey
  } = useLoaderData();
  return /* @__PURE__ */ jsxs(AppProvider, {
    embedded: true,
    apiKey,
    children: [/* @__PURE__ */ jsxs("s-app-nav", {
      children: [/* @__PURE__ */ jsx("s-link", {
        href: "/app",
        children: "Home"
      }), /* @__PURE__ */ jsx("s-link", {
        href: "/app/onboarding",
        children: "Onboarding"
      }), /* @__PURE__ */ jsx("s-link", {
        href: "/app/additional",
        children: "Additional page"
      })]
    }), /* @__PURE__ */ jsx(Outlet, {})]
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2() {
  return boundary.error(useRouteError());
});
const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: app,
  headers,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const app_additional = UNSAFE_withComponentProps(function AdditionalPage() {
  return /* @__PURE__ */ jsxs("s-page", {
    heading: "Additional page",
    children: [/* @__PURE__ */ jsxs("s-section", {
      heading: "Multiple pages",
      children: [/* @__PURE__ */ jsxs("s-paragraph", {
        children: ["The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using", " ", /* @__PURE__ */ jsx("s-link", {
          href: "https://shopify.dev/docs/apps/tools/app-bridge",
          target: "_blank",
          children: "App Bridge"
        }), "."]
      }), /* @__PURE__ */ jsxs("s-paragraph", {
        children: ["To create your own page and have it show up in the app navigation, add a page inside ", /* @__PURE__ */ jsx("code", {
          children: "app/routes"
        }), ", and a link to it in the", " ", /* @__PURE__ */ jsx("code", {
          children: "<ui-nav-menu>"
        }), " component found in", " ", /* @__PURE__ */ jsx("code", {
          children: "app/routes/app.jsx"
        }), "."]
      })]
    }), /* @__PURE__ */ jsx("s-section", {
      slot: "aside",
      heading: "Resources",
      children: /* @__PURE__ */ jsx("s-unordered-list", {
        children: /* @__PURE__ */ jsx("s-list-item", {
          children: /* @__PURE__ */ jsx("s-link", {
            href: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav",
            target: "_blank",
            children: "App nav best practices"
          })
        })
      })
    })]
  });
});
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_additional
}, Symbol.toStringTag, { value: "Module" }));
const Polaris = /* @__PURE__ */ JSON.parse('{"ActionMenu":{"Actions":{"moreActions":"More actions"},"RollupActions":{"rollupButton":"View actions"}},"ActionList":{"SearchField":{"clearButtonLabel":"Clear","search":"Search","placeholder":"Search actions"}},"Avatar":{"label":"Avatar","labelWithInitials":"Avatar with initials {initials}"},"Autocomplete":{"spinnerAccessibilityLabel":"Loading","ellipsis":"{content}…"},"Badge":{"PROGRESS_LABELS":{"incomplete":"Incomplete","partiallyComplete":"Partially complete","complete":"Complete"},"STATUS_LABELS":{"info":"Info","success":"Success","warning":"Warning","critical":"Critical","attention":"Attention","new":"New","readOnly":"Read-only","enabled":"Enabled"},"progressAndStatus":"{statusLabel} {progressLabel}"},"Banner":{"dismissButton":"Dismiss notification"},"Button":{"spinnerAccessibilityLabel":"Loading","connectedDisclosureAccessibilityLabel":"Related actions"},"Common":{"checkbox":"checkbox","undo":"Undo","cancel":"Cancel","clear":"Clear","close":"Close","submit":"Submit","more":"More"},"ContextualSaveBar":{"save":"Save","discard":"Discard"},"DataTable":{"sortAccessibilityLabel":"sort {direction} by","navAccessibilityLabel":"Scroll table {direction} one column","totalsRowHeading":"Totals","totalRowHeading":"Total"},"DatePicker":{"previousMonth":"Show previous month, {previousMonthName} {showPreviousYear}","nextMonth":"Show next month, {nextMonth} {nextYear}","today":"Today ","start":"Start of range","end":"End of range","months":{"january":"January","february":"February","march":"March","april":"April","may":"May","june":"June","july":"July","august":"August","september":"September","october":"October","november":"November","december":"December"},"days":{"monday":"Monday","tuesday":"Tuesday","wednesday":"Wednesday","thursday":"Thursday","friday":"Friday","saturday":"Saturday","sunday":"Sunday"},"daysAbbreviated":{"monday":"Mo","tuesday":"Tu","wednesday":"We","thursday":"Th","friday":"Fr","saturday":"Sa","sunday":"Su"}},"DiscardConfirmationModal":{"title":"Discard all unsaved changes","message":"If you discard changes, you’ll delete any edits you made since you last saved.","primaryAction":"Discard changes","secondaryAction":"Continue editing"},"DropZone":{"single":{"overlayTextFile":"Drop file to upload","overlayTextImage":"Drop image to upload","overlayTextVideo":"Drop video to upload","actionTitleFile":"Add file","actionTitleImage":"Add image","actionTitleVideo":"Add video","actionHintFile":"or drop file to upload","actionHintImage":"or drop image to upload","actionHintVideo":"or drop video to upload","labelFile":"Upload file","labelImage":"Upload image","labelVideo":"Upload video"},"allowMultiple":{"overlayTextFile":"Drop files to upload","overlayTextImage":"Drop images to upload","overlayTextVideo":"Drop videos to upload","actionTitleFile":"Add files","actionTitleImage":"Add images","actionTitleVideo":"Add videos","actionHintFile":"or drop files to upload","actionHintImage":"or drop images to upload","actionHintVideo":"or drop videos to upload","labelFile":"Upload files","labelImage":"Upload images","labelVideo":"Upload videos"},"errorOverlayTextFile":"File type is not valid","errorOverlayTextImage":"Image type is not valid","errorOverlayTextVideo":"Video type is not valid"},"EmptySearchResult":{"altText":"Empty search results"},"Frame":{"skipToContent":"Skip to content","navigationLabel":"Navigation","Navigation":{"closeMobileNavigationLabel":"Close navigation"}},"FullscreenBar":{"back":"Back","accessibilityLabel":"Exit fullscreen mode"},"Filters":{"moreFilters":"More filters","moreFiltersWithCount":"More filters ({count})","filter":"Filter {resourceName}","noFiltersApplied":"No filters applied","cancel":"Cancel","done":"Done","clearAllFilters":"Clear all filters","clear":"Clear","clearLabel":"Clear {filterName}","addFilter":"Add filter","clearFilters":"Clear all"},"FilterPill":{"clear":"Clear"},"IndexFilters":{"searchFilterTooltip":"Search and filter","searchFilterTooltipWithShortcut":"Search and filter (F)","searchFilterAccessibilityLabel":"Search and filter results","sort":"Sort your results","addView":"Add a new view","newView":"Custom search","SortButton":{"ariaLabel":"Sort the results","tooltip":"Sort","title":"Sort by","sorting":{"asc":"Ascending","desc":"Descending","az":"A-Z","za":"Z-A"}},"UpdateButtons":{"cancel":"Cancel","update":"Update","save":"Save","saveAs":"Save as","modal":{"title":"Save view as","label":"Name","sameName":"A view with this name already exists. Please choose a different name.","save":"Save","cancel":"Cancel"}}},"IndexProvider":{"defaultItemSingular":"Item","defaultItemPlural":"Items","allItemsSelected":"All {itemsLength}+ {resourceNamePlural} are selected","selected":"{selectedItemsCount} selected","a11yCheckboxDeselectAllSingle":"Deselect {resourceNameSingular}","a11yCheckboxSelectAllSingle":"Select {resourceNameSingular}","a11yCheckboxDeselectAllMultiple":"Deselect all {itemsLength} {resourceNamePlural}","a11yCheckboxSelectAllMultiple":"Select all {itemsLength} {resourceNamePlural}"},"IndexTable":{"emptySearchTitle":"No {resourceNamePlural} found","emptySearchDescription":"Try changing the filters or search term","onboardingBadgeText":"New","resourceLoadingAccessibilityLabel":"Loading {resourceNamePlural}…","selectAllLabel":"Select all {resourceNamePlural}","selected":"{selectedItemsCount} selected","undo":"Undo","selectAllItems":"Select all {itemsLength}+ {resourceNamePlural}","selectItem":"Select {resourceName}","selectButtonText":"Select","sortAccessibilityLabel":"sort {direction} by"},"Loading":{"label":"Page loading bar"},"Modal":{"iFrameTitle":"body markup","modalWarning":"These required properties are missing from Modal: {missingProps}"},"Page":{"Header":{"rollupActionsLabel":"View actions for {title}"}},"Pagination":{"previous":"Previous","next":"Next","pagination":"Pagination"},"ProgressBar":{"negativeWarningMessage":"Values passed to the progress prop shouldn’t be negative. Resetting {progress} to 0.","exceedWarningMessage":"Values passed to the progress prop shouldn’t exceed 100. Setting {progress} to 100."},"ResourceList":{"sortingLabel":"Sort by","defaultItemSingular":"item","defaultItemPlural":"items","showing":"Showing {itemsCount} {resource}","showingTotalCount":"Showing {itemsCount} of {totalItemsCount} {resource}","loading":"Loading {resource}","selected":"{selectedItemsCount} selected","allItemsSelected":"All {itemsLength}+ {resourceNamePlural} in your store are selected","allFilteredItemsSelected":"All {itemsLength}+ {resourceNamePlural} in this filter are selected","selectAllItems":"Select all {itemsLength}+ {resourceNamePlural} in your store","selectAllFilteredItems":"Select all {itemsLength}+ {resourceNamePlural} in this filter","emptySearchResultTitle":"No {resourceNamePlural} found","emptySearchResultDescription":"Try changing the filters or search term","selectButtonText":"Select","a11yCheckboxDeselectAllSingle":"Deselect {resourceNameSingular}","a11yCheckboxSelectAllSingle":"Select {resourceNameSingular}","a11yCheckboxDeselectAllMultiple":"Deselect all {itemsLength} {resourceNamePlural}","a11yCheckboxSelectAllMultiple":"Select all {itemsLength} {resourceNamePlural}","Item":{"actionsDropdownLabel":"Actions for {accessibilityLabel}","actionsDropdown":"Actions dropdown","viewItem":"View details for {itemName}"},"BulkActions":{"actionsActivatorLabel":"Actions","moreActionsActivatorLabel":"More actions","warningMessage":"To provide a better user experience. There should only be a maximum of {maxPromotedActions} promoted actions."}},"SkeletonPage":{"loadingLabel":"Page loading"},"Tabs":{"newViewAccessibilityLabel":"Create new view","newViewTooltip":"Create view","toggleTabsLabel":"More views","Tab":{"rename":"Rename view","duplicate":"Duplicate view","edit":"Edit view","editColumns":"Edit columns","delete":"Delete view","copy":"Copy of {name}","deleteModal":{"title":"Delete view?","description":"This can’t be undone. {viewName} view will no longer be available in your admin.","cancel":"Cancel","delete":"Delete view"}},"RenameModal":{"title":"Rename view","label":"Name","cancel":"Cancel","create":"Save","errors":{"sameName":"A view with this name already exists. Please choose a different name."}},"DuplicateModal":{"title":"Duplicate view","label":"Name","cancel":"Cancel","create":"Create view","errors":{"sameName":"A view with this name already exists. Please choose a different name."}},"CreateViewModal":{"title":"Create new view","label":"Name","cancel":"Cancel","create":"Create view","errors":{"sameName":"A view with this name already exists. Please choose a different name."}}},"Tag":{"ariaLabel":"Remove {children}"},"TextField":{"characterCount":"{count} characters","characterCountWithMaxLength":"{count} of {limit} characters used"},"TooltipOverlay":{"accessibilityLabel":"Tooltip: {label}"},"TopBar":{"toggleMenuLabel":"Toggle menu","SearchField":{"clearButtonLabel":"Clear","search":"Search"}},"MediaCard":{"dismissButton":"Dismiss","popoverButton":"Actions"},"VideoThumbnail":{"playButtonA11yLabel":{"default":"Play video","defaultWithDuration":"Play video of length {duration}","duration":{"hours":{"other":{"only":"{hourCount} hours","andMinutes":"{hourCount} hours and {minuteCount} minutes","andMinute":"{hourCount} hours and {minuteCount} minute","minutesAndSeconds":"{hourCount} hours, {minuteCount} minutes, and {secondCount} seconds","minutesAndSecond":"{hourCount} hours, {minuteCount} minutes, and {secondCount} second","minuteAndSeconds":"{hourCount} hours, {minuteCount} minute, and {secondCount} seconds","minuteAndSecond":"{hourCount} hours, {minuteCount} minute, and {secondCount} second","andSeconds":"{hourCount} hours and {secondCount} seconds","andSecond":"{hourCount} hours and {secondCount} second"},"one":{"only":"{hourCount} hour","andMinutes":"{hourCount} hour and {minuteCount} minutes","andMinute":"{hourCount} hour and {minuteCount} minute","minutesAndSeconds":"{hourCount} hour, {minuteCount} minutes, and {secondCount} seconds","minutesAndSecond":"{hourCount} hour, {minuteCount} minutes, and {secondCount} second","minuteAndSeconds":"{hourCount} hour, {minuteCount} minute, and {secondCount} seconds","minuteAndSecond":"{hourCount} hour, {minuteCount} minute, and {secondCount} second","andSeconds":"{hourCount} hour and {secondCount} seconds","andSecond":"{hourCount} hour and {secondCount} second"}},"minutes":{"other":{"only":"{minuteCount} minutes","andSeconds":"{minuteCount} minutes and {secondCount} seconds","andSecond":"{minuteCount} minutes and {secondCount} second"},"one":{"only":"{minuteCount} minute","andSeconds":"{minuteCount} minute and {secondCount} seconds","andSecond":"{minuteCount} minute and {secondCount} second"}},"seconds":{"other":"{secondCount} seconds","one":"{secondCount} second"}}}}}');
const translations = {
  Polaris
};
const volumeOptions = [{
  label: "0–100",
  value: "0-100"
}, {
  label: "100–500",
  value: "100-500"
}, {
  label: "500–2,000",
  value: "500-2000"
}, {
  label: "2,000+",
  value: "2000+"
}];
const urlPattern = /^https?:\/\/[\w\-]+(\.[\w\-]+)+([/?#][^\s]*)?$/i;
function validateProductUrls(value) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 3) {
    return "Please enter up to 3 product URLs.";
  }
  for (const line of lines) {
    if (!urlPattern.test(line)) {
      return "Each product URL must be a valid http:// or https:// address.";
    }
  }
  return "";
}
function LogoPreview({
  logoUrl,
  brandName
}) {
  const initials = brandName.trim().charAt(0).toUpperCase() || "R";
  if (logoUrl) {
    return /* @__PURE__ */ jsx(Thumbnail, {
      source: logoUrl,
      alt: brandName || "Brand logo",
      size: "large"
    });
  }
  return /* @__PURE__ */ jsx("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: 16,
      background: "#E2E8F0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#1F2937",
      fontSize: 28,
      fontWeight: 700
    },
    children: initials
  });
}
function OfferPreviewCard({
  logoUrl,
  brandName,
  description
}) {
  const displayName = brandName.trim() || "Your brand";
  const displayDescription = description.trim() ? description : "Your offer preview will appear here.";
  return /* @__PURE__ */ jsxs("div", {
    style: {
      border: "1px solid #DDE4EA",
      borderRadius: 20,
      padding: 24,
      background: "#FFFFFF",
      boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 20
      },
      children: [/* @__PURE__ */ jsx(LogoPreview, {
        logoUrl,
        brandName: displayName
      }), /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx(Text, {
          as: "p",
          variant: "headingMd",
          style: {
            margin: 0
          },
          children: displayName
        }), /* @__PURE__ */ jsx(Text, {
          as: "p",
          variant: "bodySm",
          color: "subdued",
          style: {
            marginTop: 4
          },
          children: "Partner offer card preview"
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderRadius: 18,
        background: "#F5F7FA",
        padding: 20,
        minHeight: 170,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx(Text, {
          as: "p",
          variant: "bodyMd",
          fontWeight: "bold",
          children: displayName
        }), /* @__PURE__ */ jsx(Text, {
          as: "p",
          variant: "bodyMd",
          color: description.trim() ? "subdued" : "subdued",
          style: {
            marginTop: 8,
            whiteSpace: "pre-line"
          },
          children: displayDescription
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 24
        },
        children: /* @__PURE__ */ jsx(Button, {
          disabled: true,
          fullWidth: true,
          children: "Unlock offer"
        })
      })]
    })]
  });
}
function getGapValue(gap) {
  const num = Number(gap) || 0;
  return `${num * 8}px`;
}
function VStack({
  children,
  gap
}) {
  return /* @__PURE__ */ jsx("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: getGapValue(gap)
    },
    children
  });
}
function HStack({
  children,
  align,
  justify,
  gap
}) {
  return /* @__PURE__ */ jsx("div", {
    style: {
      display: "flex",
      alignItems: align ?? "center",
      justifyContent: justify ?? "flex-start",
      gap: getGapValue(gap)
    },
    children
  });
}
async function fetchShopLogoFromAdmin(adminGraphql) {
  var _a2, _b, _c, _d, _e, _f;
  try {
    const shopResponse = await adminGraphql(`#graphql
      query {
        shop {
          name
          myShopifyDomain
        }
      }`);
    if (!shopResponse.ok) {
      console.log(`[app.onboarding] shop query failed with status`, shopResponse.status);
      return null;
    }
    const shopResult = await shopResponse.json();
    if ((_a2 = shopResult == null ? void 0 : shopResult.errors) == null ? void 0 : _a2.length) {
      console.log(`[app.onboarding] shop query errors`, shopResult.errors);
      return null;
    }
    const shopName = (_c = (_b = shopResult == null ? void 0 : shopResult.data) == null ? void 0 : _b.shop) == null ? void 0 : _c.name;
    console.log(`[app.onboarding] fetched shop info:`, {
      shopName
    });
    try {
      const metafieldsResponse = await adminGraphql(`#graphql
        query {
          shop {
            metafields(first: 10, namespace: "custom") {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }`);
      if (metafieldsResponse.ok) {
        const metafieldsResult = await metafieldsResponse.json();
        if (!((_d = metafieldsResult == null ? void 0 : metafieldsResult.errors) == null ? void 0 : _d.length) && ((_f = (_e = metafieldsResult == null ? void 0 : metafieldsResult.data) == null ? void 0 : _e.shop) == null ? void 0 : _f.metafields)) {
          const edges = metafieldsResult.data.shop.metafields.edges || [];
          for (const {
            node
          } of edges) {
            if (node.key.toLowerCase().includes("logo") && node.value.startsWith("http")) {
              console.log(`[app.onboarding] found logo in metafields:`, node.value);
              return node.value;
            }
          }
        }
      }
    } catch (metafieldError) {
      console.log(`[app.onboarding] metafields query failed (may lack required scope):`, metafieldError);
    }
    console.log(`[app.onboarding] no logo found in shop metafields`);
    return null;
  } catch (error) {
    console.log(`[app.onboarding] shop query error`, error instanceof Error ? error.message : error);
    return null;
  }
}
const loader$2 = async ({
  request
}) => {
  let logoUrl = null;
  try {
    const {
      admin
    } = await authenticate.admin(request);
    logoUrl = await fetchShopLogoFromAdmin(admin.graphql);
  } catch (error) {
    console.log(`[app.onboarding] loader error:`, error);
  }
  return Response.json({
    logoUrl
  });
};
const app_onboarding = UNSAFE_withComponentProps(function OnboardingPage() {
  const {
    logoUrl
  } = useLoaderData();
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [productUrls, setProductUrls] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState();
  const [friendlyBrands, setFriendlyBrands] = useState("");
  const [newCustomersOnly, setNewCustomersOnly] = useState(false);
  const [participateNetwork, setParticipateNetwork] = useState(true);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userLogoUrl, setUserLogoUrl] = useState(logoUrl || "");
  const productUrlsError = productUrls.trim().length > 0 ? validateProductUrls(productUrls) : "";
  const brandNameError = submissionAttempted && brandName.trim().length === 0 ? "Brand name is required." : "";
  const descriptionError = submissionAttempted && description.trim().length === 0 ? "Description is required." : "";
  const monthlyVolumeError = submissionAttempted && !monthlyVolume ? "Please select your monthly order volume." : "";
  const logoUrlError = submissionAttempted && userLogoUrl.trim().length > 0 && !urlPattern.test(userLogoUrl.trim()) ? "Logo URL must be a valid http:// or https:// address." : "";
  const hasErrors = Boolean(brandNameError) || Boolean(descriptionError) || Boolean(monthlyVolumeError) || Boolean(productUrlsError) || Boolean(logoUrlError);
  const previewLogoUrl = userLogoUrl.trim() || void 0;
  const formPayload = {
    brandName: brandName.trim(),
    description: description.trim(),
    productUrls: productUrls.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    monthlyVolume,
    friendlyBrands: friendlyBrands.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    newCustomersOnly,
    participateNetwork,
    logoUrl: userLogoUrl.trim() || null
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmissionAttempted(true);
    setSaveError(null);
    setSaveSuccess(false);
    if (hasErrors) {
      return;
    }
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formPayload)
    });
    const result = await response.json();
    if (!response.ok) {
      setSaveError((result == null ? void 0 : result.error) || "Unable to save your onboarding details.");
      return;
    }
    setSaveSuccess(true);
  };
  return /* @__PURE__ */ jsx(AppProvider$1, {
    i18n: translations,
    children: /* @__PURE__ */ jsx(Page, {
      title: "Join the Recip network",
      children: /* @__PURE__ */ jsxs(Layout, {
        children: [/* @__PURE__ */ jsx(Layout.Section, {
          children: /* @__PURE__ */ jsx(Text, {
            as: "p",
            variant: "bodyMd",
            color: "subdued",
            children: "Tell us a little about your brand so we can match you with the most relevant partner brands."
          })
        }), /* @__PURE__ */ jsx(Layout.Section, {
          oneHalf: true,
          children: /* @__PURE__ */ jsx("form", {
            onSubmit: handleSubmit,
            children: /* @__PURE__ */ jsxs(VStack, {
              gap: "6",
              children: [/* @__PURE__ */ jsx(Card, {
                sectioned: true,
                children: /* @__PURE__ */ jsxs(VStack, {
                  gap: "5",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "h2",
                    variant: "headingMd",
                    children: "Brand basics"
                  }), /* @__PURE__ */ jsx(HStack, {
                    align: "center",
                    justify: "space-between",
                    children: /* @__PURE__ */ jsxs(HStack, {
                      align: "center",
                      gap: "4",
                      children: [/* @__PURE__ */ jsx(LogoPreview, {
                        logoUrl: previewLogoUrl,
                        brandName: brandName || "Your brand"
                      }), /* @__PURE__ */ jsxs("div", {
                        children: [/* @__PURE__ */ jsx(Text, {
                          as: "p",
                          variant: "headingSm",
                          children: "Brand preview"
                        }), /* @__PURE__ */ jsx(Text, {
                          as: "p",
                          variant: "bodySm",
                          color: "subdued",
                          children: "Add your logo URL above to see it in the preview."
                        })]
                      })]
                    })
                  }), /* @__PURE__ */ jsx(TextField, {
                    label: "Brand name",
                    value: brandName,
                    onChange: setBrandName,
                    error: brandNameError,
                    requiredIndicator: true
                  }), /* @__PURE__ */ jsx(TextField, {
                    label: "Logo URL (optional)",
                    value: userLogoUrl,
                    onChange: setUserLogoUrl,
                    helpText: "We'll try to auto-detect your logo. You can edit or replace it here.",
                    error: logoUrlError,
                    placeholder: "https://example.com/logo.png"
                  }), /* @__PURE__ */ jsx(TextField, {
                    label: "Describe your products",
                    value: description,
                    onChange: setDescription,
                    multiline: 4,
                    helpText: "In 1–3 sentences, tell us what you sell and who it’s for.",
                    error: descriptionError,
                    requiredIndicator: true
                  }), /* @__PURE__ */ jsx(TextField, {
                    label: "Example product URLs",
                    value: productUrls,
                    onChange: setProductUrls,
                    multiline: 3,
                    helpText: "Add up to 3 product links, one per line, so we can match your brand more accurately.",
                    error: productUrlsError
                  })]
                })
              }), /* @__PURE__ */ jsx(Card, {
                sectioned: true,
                children: /* @__PURE__ */ jsxs(VStack, {
                  gap: "5",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "h2",
                    variant: "headingMd",
                    children: "Matching"
                  }), /* @__PURE__ */ jsx(ChoiceList, {
                    title: "How many orders do you typically get per month?",
                    choices: volumeOptions,
                    selected: monthlyVolume ? [monthlyVolume] : [],
                    onChange: (selected) => setMonthlyVolume(selected[0]),
                    allowMultiple: false,
                    error: monthlyVolumeError
                  }), /* @__PURE__ */ jsx(TextField, {
                    label: "Friendly brands you'd like to be matched with",
                    value: friendlyBrands,
                    onChange: setFriendlyBrands,
                    multiline: 3,
                    helpText: "Add brand names, one per line. We’ll use this as a signal, but matches are still based on fit and performance."
                  })]
                })
              }), /* @__PURE__ */ jsx(Card, {
                sectioned: true,
                children: /* @__PURE__ */ jsxs(VStack, {
                  gap: "4",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "h2",
                    variant: "headingMd",
                    children: "Offer rules"
                  }), /* @__PURE__ */ jsx(Checkbox, {
                    label: "Only make my discount offers available to new customers",
                    checked: newCustomersOnly,
                    onChange: setNewCustomersOnly,
                    helpText: "If enabled, Recip will create offers intended for first-time customers only."
                  })]
                })
              }), /* @__PURE__ */ jsx(Card, {
                sectioned: true,
                children: /* @__PURE__ */ jsxs(VStack, {
                  gap: "4",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "h2",
                    variant: "headingMd",
                    children: "Network participation"
                  }), /* @__PURE__ */ jsx(Checkbox, {
                    label: "Participate in the Recip network",
                    checked: participateNetwork,
                    onChange: setParticipateNetwork,
                    helpText: "If turned off, your offers will stop appearing on other stores and Recip offers will no longer be shown on your store."
                  })]
                })
              }), submissionAttempted && hasErrors ? /* @__PURE__ */ jsx(Banner, {
                status: "critical",
                children: /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  children: "Please fix the highlighted fields before continuing."
                })
              }) : null, saveError ? /* @__PURE__ */ jsx(Banner, {
                status: "critical",
                children: /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  children: saveError
                })
              }) : null, saveSuccess ? /* @__PURE__ */ jsx(Banner, {
                status: "success",
                children: /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  children: "Your onboarding details were saved."
                })
              }) : null, /* @__PURE__ */ jsx(Button, {
                primary: true,
                submit: true,
                disabled: hasErrors,
                children: "Save and continue"
              })]
            })
          })
        }), /* @__PURE__ */ jsx(Layout.Section, {
          oneHalf: true,
          children: /* @__PURE__ */ jsxs("div", {
            style: {
              position: "sticky",
              top: 24
            },
            children: [/* @__PURE__ */ jsx(Card, {
              sectioned: true,
              children: /* @__PURE__ */ jsxs(VStack, {
                gap: "4",
                children: [/* @__PURE__ */ jsxs(HStack, {
                  align: "center",
                  justify: "space-between",
                  children: [/* @__PURE__ */ jsx(Text, {
                    as: "h2",
                    variant: "headingMd",
                    children: "Live preview"
                  }), /* @__PURE__ */ jsx(Thumbnail, {
                    source: previewLogoUrl || "https://cdn.shopify.com/s/files/1/0262/4071/2720/files/placeholder-avatar.svg",
                    alt: brandName || "Logo placeholder",
                    size: "small"
                  })]
                }), /* @__PURE__ */ jsx(OfferPreviewCard, {
                  logoUrl: previewLogoUrl,
                  brandName,
                  description
                })]
              })
            }), /* @__PURE__ */ jsx(Card, {
              sectioned: true,
              children: /* @__PURE__ */ jsxs(VStack, {
                gap: "3",
                children: [/* @__PURE__ */ jsx(Text, {
                  as: "h3",
                  variant: "headingMd",
                  children: "How Recip works"
                }), /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  variant: "bodyMd",
                  color: "subdued",
                  children: "Recip matches your brand with the most relevant partner brands based on your website, product information, and order volume."
                }), /* @__PURE__ */ jsx(Text, {
                  as: "p",
                  variant: "bodySm",
                  color: "subdued",
                  children: "After you continue, we’ll suggest a category and sub-category for your brand. You’ll be able to confirm or edit it."
                })]
              })
            })]
          })
        })]
      })
    })
  });
});
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_onboarding,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({
  request
}) => {
  await authenticate.admin(request);
  return Response.json({});
};
const app__index = UNSAFE_withComponentProps(function Home2() {
  const location = useLocation();
  const search = location.search || "";
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: 40,
      maxWidth: 980,
      margin: "0 auto",
      fontFamily: "Inter, sans-serif"
    },
    children: [/* @__PURE__ */ jsx("h1", {
      style: {
        fontSize: 36,
        marginBottom: 16
      },
      children: "Welcome to Recip"
    }), /* @__PURE__ */ jsx("p", {
      style: {
        fontSize: 18,
        lineHeight: 1.7,
        marginBottom: 24
      },
      children: "This is your home landing page. Use the onboarding flow to connect your brand and configure your first partner offers."
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
      },
      children: [/* @__PURE__ */ jsx("a", {
        href: `/app/onboarding${search}`,
        style: {
          display: "inline-block",
          padding: "12px 20px",
          borderRadius: 10,
          background: "#00695c",
          color: "white",
          textDecoration: "none",
          fontWeight: 600
        },
        children: "Go to onboarding"
      }), /* @__PURE__ */ jsx("a", {
        href: `/app/additional${search}`,
        style: {
          display: "inline-block",
          padding: "12px 20px",
          borderRadius: 10,
          background: "#f4f6f8",
          color: "#111827",
          textDecoration: "none",
          fontWeight: 600
        },
        children: "View additional page"
      })]
    })]
  });
});
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app__index,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const loader = async ({
  request
}) => {
  await authenticate.admin(request);
  const htmlPath = path.resolve(process.cwd(), "public", "index.html");
  const html = await readFile(htmlPath, "utf8");
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
};
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-DzgJ9FzB.js", "imports": ["/assets/chunk-LFPYN7LY-DAgSEAUT.js", "/assets/index-2H5U1vOi.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-C3-JMdhV.js", "imports": ["/assets/chunk-LFPYN7LY-DAgSEAUT.js", "/assets/index-2H5U1vOi.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "root", "path": "webhooks/app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app_uninstalled": { "id": "routes/webhooks.app_uninstalled", "parentId": "root", "path": "webhooks/app_uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app_uninstalled-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.orders.create": { "id": "routes/webhooks.orders.create", "parentId": "root", "path": "webhooks/orders/create", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.orders.create-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.events.impression": { "id": "routes/api.events.impression", "parentId": "root", "path": "api/events/impression", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.events.impression-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.friendly-brands": { "id": "routes/api.friendly-brands", "parentId": "root", "path": "api/friendly-brands", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.friendly-brands-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.friendly-brands.$id": { "id": "routes/api.friendly-brands.$id", "parentId": "routes/api.friendly-brands", "path": ":id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.friendly-brands._id-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.onboarding": { "id": "routes/api.onboarding", "parentId": "root", "path": "api/onboarding", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.onboarding-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.settings": { "id": "routes/api.settings", "parentId": "root", "path": "api/settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.settings-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.offers": { "id": "routes/api.offers", "parentId": "root", "path": "api/offers", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.offers-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.login": { "id": "routes/auth.login", "parentId": "root", "path": "auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-CuZb7FNa.js", "imports": ["/assets/chunk-LFPYN7LY-DAgSEAUT.js", "/assets/AppProxyProvider-DdmIRpyq.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/r.$offerId": { "id": "routes/r.$offerId", "parentId": "root", "path": "r/:offerId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/r._offerId-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-zw1TmTq0.js", "imports": ["/assets/chunk-LFPYN7LY-DAgSEAUT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": true, "module": "/assets/app-BTyQ6t07.js", "imports": ["/assets/chunk-LFPYN7LY-DAgSEAUT.js", "/assets/AppProxyProvider-DdmIRpyq.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.additional": { "id": "routes/app.additional", "parentId": "routes/app", "path": "additional", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.additional-BHY5xze9.js", "imports": ["/assets/chunk-LFPYN7LY-DAgSEAUT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.onboarding": { "id": "routes/app.onboarding", "parentId": "routes/app", "path": "onboarding", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.onboarding-DIsglru7.js", "imports": ["/assets/chunk-LFPYN7LY-DAgSEAUT.js", "/assets/index-2H5U1vOi.js"], "css": ["/assets/app-UBlowCeV.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app._index-zw1TmTq0.js", "imports": ["/assets/chunk-LFPYN7LY-DAgSEAUT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.html": { "id": "routes/app.html", "parentId": "routes/app", "path": "html", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/app.html-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-052f901b.js", "version": "052f901b", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/webhooks.app_uninstalled": {
    id: "routes/webhooks.app_uninstalled",
    parentId: "root",
    path: "webhooks/app_uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/webhooks.orders.create": {
    id: "routes/webhooks.orders.create",
    parentId: "root",
    path: "webhooks/orders/create",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/api.events.impression": {
    id: "routes/api.events.impression",
    parentId: "root",
    path: "api/events/impression",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/api.friendly-brands": {
    id: "routes/api.friendly-brands",
    parentId: "root",
    path: "api/friendly-brands",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/api.friendly-brands.$id": {
    id: "routes/api.friendly-brands.$id",
    parentId: "routes/api.friendly-brands",
    path: ":id",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/api.onboarding": {
    id: "routes/api.onboarding",
    parentId: "root",
    path: "api/onboarding",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/api.settings": {
    id: "routes/api.settings",
    parentId: "root",
    path: "api/settings",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/api.offers": {
    id: "routes/api.offers",
    parentId: "root",
    path: "api/offers",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/r.$offerId": {
    id: "routes/r.$offerId",
    parentId: "root",
    path: "r/:offerId",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route13
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/app.onboarding": {
    id: "routes/app.onboarding",
    parentId: "routes/app",
    path: "onboarding",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route18
  },
  "routes/app.html": {
    id: "routes/app.html",
    parentId: "routes/app",
    path: "html",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
