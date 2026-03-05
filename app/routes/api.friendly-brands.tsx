import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendFriendlyBrandLead } from "../lib/googleSheets.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("[friendly-brands] GET", request.url);
  const { session } = await authenticate.admin(request);
  console.log("[friendly-brands] shop", session.shop);
  const shop = await db.shop.upsert({
    where: { shopDomain: session.shop },
    update: {},
    create: { shopDomain: session.shop },
  });

  const brands = await db.friendlyBrand.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(brands);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("[friendly-brands] POST", request.url);
  const { session } = await authenticate.admin(request);
  console.log("[friendly-brands] shop", session.shop);
  const shop = await db.shop.upsert({
    where: { shopDomain: session.shop },
    update: {},
    create: { shopDomain: session.shop },
  });

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  console.log("[friendly-brands] body", body);
  const brandDomain = String(body?.brandDomain || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  if (!brandDomain) {
    return Response.json({ error: "brandDomain is required" }, { status: 400 });
  }

  const created = await db.friendlyBrand.create({
    data: {
      shopId: shop.id,
      brandDomain,
    },
  });
  console.log("[friendly-brands] created", created.id);

  await sendFriendlyBrandLead({
    fromShopDomain: shop.shopDomain,
    fromShopName: shop.shopDomain,
    enteredBrandDomain: brandDomain,
  });

  return Response.json(created, { status: 201 });
};
