import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return Response.json({ ok: true });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = (await request.json()) as {
    brandName?: string;
    websiteUrl?: string;
    description?: string;
    productUrls?: string[];
    monthlyVolume?: string;
    friendlyBrands?: string[];
    newCustomersOnly?: boolean;
    participateNetwork?: boolean;
  };

  const brandName = body.brandName?.trim();
  const websiteUrl = body.websiteUrl?.trim();
  const description = body.description?.trim();

  if (!brandName) {
    return Response.json({ error: "Brand name is required." }, { status: 400 });
  }

  if (!websiteUrl) {
    return Response.json({ error: "Website URL is required." }, { status: 400 });
  }

  if (!description) {
    return Response.json({ error: "Description is required." }, { status: 400 });
  }

  if (!body.monthlyVolume) {
    return Response.json({ error: "Monthly order volume is required." }, { status: 400 });
  }

  console.log("[onboarding] shop=", session.shop, {
    brandName,
    websiteUrl,
    description,
    productUrls: body.productUrls,
    monthlyVolume: body.monthlyVolume,
    friendlyBrands: body.friendlyBrands,
    newCustomersOnly: Boolean(body.newCustomersOnly),
    participateNetwork: Boolean(body.participateNetwork),
  });

  // TODO: save onboarding details to the database using Shop or ShopSettings.
  // Example: await db.shopSettings.upsert({ where: { shopId }, update: { ... }, create: { ... } });

  return Response.json({ ok: true });
};
