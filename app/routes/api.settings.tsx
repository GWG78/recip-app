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

  const settings = await db.shopSettings.upsert({
    where: { shopId: shop.id },
    update: {},
    create: { shopId: shop.id },
  });

  return Response.json(settings);
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
  const active = Boolean(body?.active);

  const settings = await db.shopSettings.upsert({
    where: { shopId: shop.id },
    update: { active },
    create: { shopId: shop.id, active },
  });

  return Response.json(settings);
};
