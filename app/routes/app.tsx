import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendInstallLead } from "../lib/googleSheets.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const existingShop = await db.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!existingShop) {
    await db.shop.create({
      data: {
        shopDomain: session.shop,
        installed: true,
        uninstalledAt: null,
      },
    });
    await sendInstallLead({ shopDomain: session.shop });
  } else if (!existingShop.installed || existingShop.uninstalledAt) {
    await db.shop.update({
      where: { id: existingShop.id },
      data: {
        installed: true,
        uninstalledAt: null,
      },
    });
    await sendInstallLead({ shopDomain: session.shop });
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
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
