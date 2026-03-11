var _a;
import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter, UNSAFE_withComponentProps, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useActionData, Form, redirect, UNSAFE_withErrorBoundaryProps, useRouteError } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import "@shopify/shopify-app-react-router/adapters/node";
import { shopifyApp, AppDistribution, ApiVersion, LoginErrorType, boundary } from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient, ReferralEventType } from "@prisma/client";
import { randomBytes } from "crypto";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
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
const action$7 = async ({
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
  action: action$7
}, Symbol.toStringTag, { value: "Module" }));
const action$6 = async ({
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
  action: action$6
}, Symbol.toStringTag, { value: "Module" }));
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6
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
  if (!endpoint) return false;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} - ${body}`);
  }
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
const action$5 = async ({
  request
}) => {
  var _a2, _b;
  const {
    payload,
    topic,
    shop
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
  return new Response();
};
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5
}, Symbol.toStringTag, { value: "Module" }));
async function action$4({
  request
}) {
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
  await prisma.referralEvent.create({
    data: {
      type: ReferralEventType.IMPRESSION,
      fromShopId: fromShopId ?? toShopId,
      // safe default
      toShopId,
      meta: {
        offerId,
        orderId
      }
    }
  });
  return Response.json({
    ok: true
  });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4
}, Symbol.toStringTag, { value: "Module" }));
const loader$8 = async ({
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
const action$3 = async ({
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
  action: action$3,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
const action$2 = async ({
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
  action: action$2
}, Symbol.toStringTag, { value: "Module" }));
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
  const endsAt = new Date(startsAt.getTime() + args.expiryHours * 60 * 60 * 1e3);
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
  const expiryHours = options.expiryHours ?? DEFAULT_EXPIRY_HOURS;
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
    try {
      const shopifyResult = await createShopifyDiscountCode({
        adminClient,
        code,
        discountKind,
        discountValue,
        expiryHours
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
      console.log(`[pool] toShopId=${toShopId} created ${code}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pool] toShopId=${toShopId} failed creating code ${code}: ${message}`);
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
const loader$7 = async ({
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
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
function loginErrorMessage(loginErrors) {
  if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  return {};
}
const loader$6 = async ({
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
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: route$1,
  loader: loader$6
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
async function activateDiscountFromPool({
  fromShopId,
  toShopId,
  offerId,
  orderId,
  expiryHours = EXPIRY_HOURS,
  adminClient
}) {
  await ensureDiscountPool(toShopId, { adminClient });
  const now = /* @__PURE__ */ new Date();
  const endsAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1e3);
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
  try {
    await ensureDiscountPool(toShopId, { adminClient });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[pool] replenish after activation failed toShopId=${toShopId}: ${message}`);
  }
  return activatedCode;
}
async function loader$5({
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
  const toShopId = "DESTINATION_SHOP_ID";
  const shopDomain = `${toShopId}.myshopify.com`;
  const discount = await activateDiscountFromPool({
    toShopId,
    offerId,
    orderId
  });
  return Response.json({
    code: discount.code,
    shopUrl: `https://${shopDomain}/discount/${discount.code}`
  });
}
const r_$offerId = UNSAFE_withComponentProps(function OfferPage() {
  const {
    code,
    shopUrl
  } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 420,
      margin: "48px auto",
      fontFamily: "system-ui",
      padding: 16
    },
    children: [/* @__PURE__ */ jsx("h2", {
      children: "🎉 Your discount is ready"
    }), /* @__PURE__ */ jsx("div", {
      style: {
        marginTop: 16,
        marginBottom: 16,
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 8,
        fontSize: 18,
        fontWeight: 600,
        textAlign: "center"
      },
      children: code
    }), /* @__PURE__ */ jsx("button", {
      style: {
        width: "100%",
        padding: 12,
        marginBottom: 12,
        cursor: "pointer"
      },
      onClick: () => navigator.clipboard.writeText(code),
      children: "Copy code"
    }), /* @__PURE__ */ jsx("a", {
      href: shopUrl,
      target: "_blank",
      rel: "noreferrer",
      children: /* @__PURE__ */ jsx("button", {
        style: {
          width: "100%",
          padding: 12,
          background: "black",
          color: "white",
          cursor: "pointer"
        },
        children: "Shop now"
      })
    })]
  });
});
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: r_$offerId,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const index = "_index_12o3y_1";
const heading = "_heading_12o3y_11";
const text = "_text_12o3y_12";
const content = "_content_12o3y_22";
const form = "_form_12o3y_27";
const label = "_label_12o3y_35";
const input = "_input_12o3y_43";
const button = "_button_12o3y_47";
const list = "_list_12o3y_51";
const styles = {
  index,
  heading,
  text,
  content,
  form,
  label,
  input,
  button,
  list
};
const loader$4 = async ({
  request
}) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return {
    showForm: Boolean(login)
  };
};
const route = UNSAFE_withComponentProps(function App2() {
  const {
    showForm
  } = useLoaderData();
  return /* @__PURE__ */ jsx("div", {
    className: styles.index,
    children: /* @__PURE__ */ jsxs("div", {
      className: styles.content,
      children: [/* @__PURE__ */ jsx("h1", {
        className: styles.heading,
        children: "A short heading about [your app]"
      }), /* @__PURE__ */ jsx("p", {
        className: styles.text,
        children: "A tagline about [your app] that describes your value proposition."
      }), showForm && /* @__PURE__ */ jsxs(Form, {
        className: styles.form,
        method: "post",
        action: "/auth/login",
        children: [/* @__PURE__ */ jsxs("label", {
          className: styles.label,
          children: [/* @__PURE__ */ jsx("span", {
            children: "Shop domain"
          }), /* @__PURE__ */ jsx("input", {
            className: styles.input,
            type: "text",
            name: "shop"
          }), /* @__PURE__ */ jsx("span", {
            children: "e.g: my-shop-domain.myshopify.com"
          })]
        }), /* @__PURE__ */ jsx("button", {
          className: styles.button,
          type: "submit",
          children: "Log in"
        })]
      }), /* @__PURE__ */ jsxs("ul", {
        className: styles.list,
        children: [/* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        }), /* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        }), /* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        })]
      })]
    })
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: route,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const loader$3 = async ({
  request
}) => {
  await authenticate.admin(request);
  return null;
};
const headers$1 = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  headers: headers$1,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({
  request
}) => {
  const {
    session,
    admin
  } = await authenticate.admin(request);
  const adminClient = {
    graphql: admin.graphql.bind(admin)
  };
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
        uninstalledAt: null
      }
    });
    await sendInstallLead({
      shopDomain: session.shop
    });
    await ensureDiscountPool(createdShop.id, {
      adminClient
    });
  } else if (!existingShop.installed || existingShop.uninstalledAt) {
    await prisma.shop.update({
      where: {
        id: existingShop.id
      },
      data: {
        installed: true,
        uninstalledAt: null
      }
    });
    await sendInstallLead({
      shopDomain: session.shop
    });
    await ensureDiscountPool(existingShop.id, {
      adminClient
    });
  }
  return {
    apiKey: process.env.SHOPIFY_API_KEY || ""
  };
};
const app = UNSAFE_withComponentProps(function App3() {
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
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: app,
  headers,
  loader: loader$2
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
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_additional
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({
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
const app__index = UNSAFE_withComponentProps(function Index() {
  return null;
});
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
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
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-f6PY61Pe.js", "imports": ["/assets/jsx-runtime-Dvv0mw5A.js", "/assets/chunk-LFPYN7LY-DjDQdfDQ.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-CFTfiVTZ.js", "imports": ["/assets/jsx-runtime-Dvv0mw5A.js", "/assets/chunk-LFPYN7LY-DjDQdfDQ.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "root", "path": "webhooks/app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app_uninstalled": { "id": "routes/webhooks.app_uninstalled", "parentId": "root", "path": "webhooks/app_uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app_uninstalled-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.orders.create": { "id": "routes/webhooks.orders.create", "parentId": "root", "path": "webhooks/orders/create", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.orders.create-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.events.impression": { "id": "routes/api.events.impression", "parentId": "root", "path": "api/events/impression", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.events.impression-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.friendly-brands": { "id": "routes/api.friendly-brands", "parentId": "root", "path": "api/friendly-brands", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.friendly-brands-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.friendly-brands.$id": { "id": "routes/api.friendly-brands.$id", "parentId": "routes/api.friendly-brands", "path": ":id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.friendly-brands._id-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.settings": { "id": "routes/api.settings", "parentId": "root", "path": "api/settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.settings-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.login": { "id": "routes/auth.login", "parentId": "root", "path": "auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-CIyrABlo.js", "imports": ["/assets/chunk-LFPYN7LY-DjDQdfDQ.js", "/assets/jsx-runtime-Dvv0mw5A.js", "/assets/AppProxyProvider-BoMWCWsQ.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/r.$offerId": { "id": "routes/r.$offerId", "parentId": "root", "path": "r/:offerId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/r._offerId-BaZLoyvE.js", "imports": ["/assets/chunk-LFPYN7LY-DjDQdfDQ.js", "/assets/jsx-runtime-Dvv0mw5A.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-IwSztuCj.js", "imports": ["/assets/chunk-LFPYN7LY-DjDQdfDQ.js", "/assets/jsx-runtime-Dvv0mw5A.js"], "css": ["/assets/route-Xpdx9QZl.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": true, "module": "/assets/app-Bo1piqih.js", "imports": ["/assets/chunk-LFPYN7LY-DjDQdfDQ.js", "/assets/jsx-runtime-Dvv0mw5A.js", "/assets/AppProxyProvider-BoMWCWsQ.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.additional": { "id": "routes/app.additional", "parentId": "routes/app", "path": "additional", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.additional-I9Evg-kr.js", "imports": ["/assets/chunk-LFPYN7LY-DjDQdfDQ.js", "/assets/jsx-runtime-Dvv0mw5A.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app._index-DT4jlyWQ.js", "imports": ["/assets/chunk-LFPYN7LY-DjDQdfDQ.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.html": { "id": "routes/app.html", "parentId": "routes/app", "path": "html", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/app.html-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-b39d9c5e.js", "version": "b39d9c5e", "sri": void 0 };
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
  "routes/api.settings": {
    id: "routes/api.settings",
    parentId: "root",
    path: "api/settings",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/r.$offerId": {
    id: "routes/r.$offerId",
    parentId: "root",
    path: "r/:offerId",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route11
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route15
  },
  "routes/app.html": {
    id: "routes/app.html",
    parentId: "routes/app",
    path: "html",
    index: void 0,
    caseSensitive: void 0,
    module: route16
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
