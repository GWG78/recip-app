import { useLoaderData, useLocation } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  AppProvider as PolarisAppProvider,
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Button,
  Thumbnail,
  VerticalStack,
  HorizontalStack,
  Divider,
  Banner,
} from "@shopify/polaris";
import translations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const shop = await db.shop.findUnique({
    where: { shopDomain: session.shop },
    include: { settings: true },
  });

  const settings = shop?.settings ?? null;

  return Response.json({
    brandName: settings?.brandName ?? null,
    logoUrl: settings?.logoUrl ?? null,
    brandDescription: settings?.brandDescription ?? null,
    discountType: settings?.discountType ?? "PERCENTAGE",
    discountValue: settings?.discountValue ? Number(settings.discountValue) : null,
    newCustomersOnly: settings?.newCustomersOnly ?? false,
    participateNetwork: settings?.participateNetwork ?? true,
    monthlyVolume: settings?.monthlyVolume ?? null,
    active: settings?.active ?? true,
  });
};

function SettingRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <HorizontalStack align="space-between" blockAlign="start" gap="400">
      <Text as="span" variant="bodyMd" tone="subdued">
        {label}
      </Text>
      <Text as="span" variant="bodyMd">
        {value}
      </Text>
    </HorizontalStack>
  );
}

export default function Home() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const search = location.search || "";

  const isSetUp = Boolean(data.brandName);

  const offerText = data.discountValue
    ? data.discountType === "PERCENTAGE"
      ? `${data.discountValue}% off`
      : `$${data.discountValue} off`
    : "Not set";

  return (
    <PolarisAppProvider i18n={translations}>
      <Page title="Recip">
        <Layout>
          {!isSetUp && (
            <Layout.Section>
              <Banner tone="info">
                <Text as="p">
                  Your brand isn't set up yet. Complete onboarding to join the Recip network and start showing offers.
                </Text>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <VerticalStack gap="400">
              {isSetUp && (
                <Card padding="500">
                  <VerticalStack gap="400">
                    <Text as="h2" variant="headingMd">
                      Brand
                    </Text>

                    <HorizontalStack gap="400" blockAlign="start">
                      {data.logoUrl ? (
                        <Thumbnail
                          source={data.logoUrl}
                          alt={data.brandName ?? "Brand logo"}
                          size="large"
                        />
                      ) : (
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 8,
                            background: "#E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#1F2937",
                            flexShrink: 0,
                          }}
                        >
                          {(data.brandName ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <VerticalStack gap="100">
                        <Text as="p" variant="headingSm">
                          {data.brandName}
                        </Text>
                        {data.brandDescription && (
                          <Text as="p" variant="bodyMd" tone="subdued">
                            {data.brandDescription}
                          </Text>
                        )}
                      </VerticalStack>
                    </HorizontalStack>

                    <Divider />

                    <VerticalStack gap="300">
                      <SettingRow label="Offer" value={offerText} />
                      <SettingRow
                        label="Eligibility"
                        value={data.newCustomersOnly ? "New customers only" : "All customers"}
                      />
                      <SettingRow
                        label="Monthly orders"
                        value={data.monthlyVolume ?? "Not specified"}
                      />
                      <SettingRow
                        label="Network"
                        value={
                          data.participateNetwork ? (
                            <Badge tone="success">Active</Badge>
                          ) : (
                            <Badge tone="warning">Paused</Badge>
                          )
                        }
                      />
                    </VerticalStack>
                  </VerticalStack>
                </Card>
              )}

              <Button
                variant="primary"
                size="large"
                url={`/app/onboarding${search}`}
              >
                {isSetUp ? "Edit settings" : "Get started with onboarding"}
              </Button>
            </VerticalStack>
          </Layout.Section>
        </Layout>
      </Page>
    </PolarisAppProvider>
  );
}
