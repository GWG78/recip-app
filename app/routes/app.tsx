import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendInstallLead } from "../lib/googleSheets.server";
import { ensureDiscountPool } from "../services/createPoolCodes";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let apiKey = process.env.SHOPIFY_API_KEY || "";

  try {
    const { session, admin } = await authenticate.admin(request);
    const adminClient = {
      graphql: admin.graphql.bind(admin),
    };
    const sessionAccessToken =
      (session as unknown as { accessToken?: string | null }).accessToken ?? null;
    const sessionScope = (session as unknown as { scope?: string | null }).scope ?? null;

    const existingShop = await db.shop.findUnique({
      where: { shopDomain: session.shop },
    });

    if (!existingShop) {
      const createdShop = await db.shop.create({
        data: {
          shopDomain: session.shop,
          installed: true,
          uninstalledAt: null,
          accessToken: sessionAccessToken,
          scope: sessionScope,
        },
      });
      await sendInstallLead({ shopDomain: session.shop });
      await ensureDiscountPool(createdShop.id, { adminClient });
    } else {
      await db.shop.update({
        where: { id: existingShop.id },
        data: {
          ...(sessionAccessToken ? { accessToken: sessionAccessToken } : {}),
          ...(sessionScope ? { scope: sessionScope } : {}),
          ...(!existingShop.installed || existingShop.uninstalledAt
            ? {
                installed: true,
                uninstalledAt: null,
              }
            : {}),
        },
      });

      if (!existingShop.installed || existingShop.uninstalledAt) {
        await sendInstallLead({ shopDomain: session.shop });
        await ensureDiscountPool(existingShop.id, { adminClient });
      }
    }
  } catch {
    // Allow the app to render without forcing Shopify admin authentication.
  }

  return { apiKey };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app/onboarding">Onboarding</s-link>
        <s-link href="/app/additional">Additional page</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
