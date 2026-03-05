import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { DiscountType } from "@prisma/client";
import { ensureDiscountPool } from "../services/createPoolCodes";

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
  const { session, admin } = await authenticate.admin(request);
  const shop = await db.shop.upsert({
    where: { shopDomain: session.shop },
    update: {},
    create: { shopDomain: session.shop },
  });

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const current = await db.shopSettings.findUnique({
    where: { shopId: shop.id },
    select: { discountType: true },
  });
  const updateData: {
    active?: boolean;
    discountType?: DiscountType;
    discountValue?: number;
  } = {};

  if (typeof body?.active !== "undefined") {
    updateData.active = Boolean(body.active);
  }

  if (typeof body?.discountType !== "undefined") {
    if (body.discountType !== "PERCENTAGE" && body.discountType !== "FIXED") {
      return Response.json({ error: "Invalid discountType" }, { status: 400 });
    }
    updateData.discountType = body.discountType as DiscountType;
  }

  if (typeof body?.discountValue !== "undefined") {
    const parsedValue = Number(body.discountValue);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return Response.json({ error: "discountValue must be greater than 0" }, { status: 400 });
    }
    const effectiveDiscountType =
      updateData.discountType ?? current?.discountType ?? "PERCENTAGE";
    if (effectiveDiscountType === "PERCENTAGE" && parsedValue > 100) {
      return Response.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
    }
    updateData.discountValue = parsedValue;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No settings provided" }, { status: 400 });
  }

  const settings = await db.shopSettings.upsert({
    where: { shopId: shop.id },
    update: updateData,
    create: {
      shopId: shop.id,
      active: updateData.active ?? true,
      discountType: updateData.discountType ?? "PERCENTAGE",
      discountValue: updateData.discountValue ?? 10,
    },
  });

  const discountChanged =
    typeof updateData.discountType !== "undefined" ||
    typeof updateData.discountValue !== "undefined";

  if (discountChanged) {
    await db.discountCode.updateMany({
      where: {
        toShopId: shop.id,
        state: "POOL",
      },
      data: {
        state: "VOID",
      },
    });

    await ensureDiscountPool(shop.id, {
      adminClient: { graphql: admin.graphql.bind(admin) },
    });
  }

  return Response.json(settings);
};
