import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
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
  const { session } = await authenticate.admin(request);
  const shop = await db.shop.upsert({
    where: { shopDomain: session.shop },
    update: {},
    create: { shopDomain: session.shop },
  });

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const brandDomain = String(body?.brandDomain || "").trim().toLowerCase();

  if (!brandDomain) {
    return Response.json({ error: "brandDomain is required" }, { status: 400 });
  }

  const created = await db.friendlyBrand.create({
    data: {
      shopId: shop.id,
      brandDomain,
    },
  });

  return Response.json(created, { status: 201 });
};
