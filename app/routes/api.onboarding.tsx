import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { DiscountType } from "@prisma/client";

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
    logoUrl?: string;
    description?: string;
    productUrls?: string[];
    monthlyVolume?: string;
    friendlyBrands?: string[];
    offerType?: "percentage" | "fixed";
    offerValue?: string;
    newCustomersOnly?: boolean;
    participateNetwork?: boolean;
  };

  const brandName = body.brandName?.trim();
  const description = body.description?.trim();
  const offerValue = body.offerValue?.trim();

  if (!brandName) {
    return Response.json({ error: "Brand name is required." }, { status: 400 });
  }

  if (!description) {
    return Response.json({ error: "Description is required." }, { status: 400 });
  }

  if (!body.monthlyVolume) {
    return Response.json({ error: "Monthly order volume is required." }, { status: 400 });
  }

  const shop = await db.shop.upsert({
    where: { shopDomain: session.shop },
    update: {},
    create: { shopDomain: session.shop },
  });

  const settings = await db.shopSettings.upsert({
    where: { shopId: shop.id },
    update: {
      brandName,
      logoUrl: body.logoUrl?.trim() || null,
      brandDescription: description,
      productUrls: body.productUrls ?? [],
      friendlyBrands: body.friendlyBrands ?? [],
      monthlyVolume: body.monthlyVolume,
      newCustomersOnly: Boolean(body.newCustomersOnly),
      participateNetwork: typeof body.participateNetwork === "undefined" ? true : Boolean(body.participateNetwork),
      discountType:
        body.offerType === "fixed" ? DiscountType.FIXED : DiscountType.PERCENTAGE,
      discountValue: offerValue ? Number(offerValue) : undefined,
    },
    create: {
      shopId: shop.id,
      brandName,
      logoUrl: body.logoUrl?.trim() || null,
      brandDescription: description,
      productUrls: body.productUrls ?? [],
      friendlyBrands: body.friendlyBrands ?? [],
      monthlyVolume: body.monthlyVolume,
      newCustomersOnly: Boolean(body.newCustomersOnly),
      participateNetwork: typeof body.participateNetwork === "undefined" ? true : Boolean(body.participateNetwork),
      discountType:
        body.offerType === "fixed" ? DiscountType.FIXED : DiscountType.PERCENTAGE,
      discountValue: offerValue ? Number(offerValue) : 0,
    },
  });

  // Create or update FriendlyBrand records from the form input
  if (body.friendlyBrands && body.friendlyBrands.length > 0) {
    // Delete existing friendly brands for this shop
    await db.friendlyBrand.deleteMany({
      where: { shopId: shop.id },
    });

    // Create new ones from the form input
    for (const brandName of body.friendlyBrands) {
      const normalizedDomain = String(brandName)
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

      if (normalizedDomain) {
        await db.friendlyBrand.create({
          data: {
            shopId: shop.id,
            brandDomain: normalizedDomain,
          },
        });
      }
    }
  }

  console.log("[onboarding] shop=", session.shop, {
    brandName,
    description,
    logoUrl: body.logoUrl,
    productUrls: body.productUrls,
    monthlyVolume: body.monthlyVolume,
    friendlyBrands: body.friendlyBrands,
    offerType: body.offerType,
    offerValue,
    newCustomersOnly: Boolean(body.newCustomersOnly),
    participateNetwork: Boolean(body.participateNetwork),
    settingsId: settings.id,
  });

  return Response.json({ ok: true });
};
