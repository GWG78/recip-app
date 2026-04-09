import { useState, type ReactNode } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import {
  AppProvider as PolarisAppProvider,
  Page,
  Layout,
  Card,
  Text,
  TextField,
  ChoiceList,
  Checkbox,
  Button,
  Banner,
  Thumbnail,
} from "@shopify/polaris";
import translations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const volumeOptions = [
  { label: "0–100", value: "0-100" },
  { label: "100–500", value: "100-500" },
  { label: "500–2,000", value: "500-2000" },
  { label: "2,000+", value: "2000+" },
];

const urlPattern = /^https?:\/\/[\w\-]+(\.[\w\-]+)+([/?#][^\s]*)?$/i;

function validateProductUrls(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 3) {
    return "Please enter up to 3 product URLs.";
  }

  for (const line of lines) {
    if (!urlPattern.test(line)) {
      return "Each product URL must be a valid http:// or https:// address.";
    }
  }

  return "";
}

function LogoPreview({ logoUrl, brandName }: { logoUrl?: string; brandName: string }) {
  const initials = brandName.trim().charAt(0).toUpperCase() || "R";

  if (logoUrl) {
    return <Thumbnail source={logoUrl} alt={brandName || "Brand logo"} size="large" />;
  }

  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: 16,
        background: "#E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#1F2937",
        fontSize: 28,
        fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}

function OfferPreviewCard({
  logoUrl,
  brandName,
  description,
}: {
  logoUrl?: string;
  brandName: string;
  description: string;
}) {
  const displayName = brandName.trim() || "Your brand";
  const displayDescription = description.trim()
    ? description
    : "Your offer preview will appear here.";

  return (
    <div
      style={{
        border: "1px solid #DDE4EA",
        borderRadius: 20,
        padding: 24,
        background: "#FFFFFF",
        boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <LogoPreview logoUrl={logoUrl} brandName={displayName} />
        <div>
          <Text as="p" variant="headingMd" style={{ margin: 0 }}>
            {displayName}
          </Text>
          <Text as="p" variant="bodySm" color="subdued" style={{ marginTop: 4 }}>
            Partner offer card preview
          </Text>
        </div>
      </div>

      <div
        style={{
          borderRadius: 18,
          background: "#F5F7FA",
          padding: 20,
          minHeight: 170,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Text as="p" variant="bodyMd" fontWeight="bold">
            {displayName}
          </Text>
          <Text
            as="p"
            variant="bodyMd"
            color={description.trim() ? "subdued" : "subdued"}
            style={{ marginTop: 8, whiteSpace: "pre-line" }}
          >
            {displayDescription}
          </Text>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 24 }}>
          <Button disabled fullWidth>
            Unlock offer
          </Button>
        </div>
      </div>
    </div>
  );
}

function getGapValue(gap: string | number | undefined) {
  const num = Number(gap) || 0;
  return `${num * 8}px`;
}

function VStack({
  children,
  gap,
}: {
  children: ReactNode;
  gap?: string | number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: getGapValue(gap) }}>
      {children}
    </div>
  );
}

function HStack({
  children,
  align,
  justify,
  gap,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
  gap?: string | number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: align ?? "center",
        justifyContent: justify ?? "flex-start",
        gap: getGapValue(gap),
      }}
    >
      {children}
    </div>
  );
}

async function fetchShopBrandLogo(shop: string | undefined, accessToken: string | undefined) {
  if (!shop || !accessToken) {
    return null;
  }

  const query = `
    query ShopBrandLogo {
      shop {
        name
        brand {
          logo {
            image {
              url
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query }),
    });

    const json = await response.json().catch((error) => {
      console.log(`[app.onboarding] shop=${shop} logo fetch invalid JSON`, {
        status: response.status,
        error,
      });
      return null;
    });

    if (!response.ok) {
      console.log(`[app.onboarding] shop=${shop} logo fetch failed`, {
        status: response.status,
        body: json,
      });
      return null;
    }

    if (json?.errors?.length) {
      console.log(`[app.onboarding] shop=${shop} logo query errors`, json.errors);
    }

    const logoUrl = json?.data?.shop?.brand?.logo?.image?.url ?? null;
    console.log(`[app.onboarding] shop=${shop} logo fetched`, { logoUrl });
    return logoUrl;
  } catch (error) {
    console.log(`[app.onboarding] shop=${shop} logo fetch error`, error);
    return null;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop") ?? undefined;
  let logoUrl: string | null = null;

  console.log(`[app.onboarding] loader starting`, {
    shopParam,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  });

  // First try to get logo using shop parameter from database
  if (shopParam) {
    try {
      const existingShop = await db.shop.findUnique({
        where: { shopDomain: shopParam },
        select: { accessToken: true },
      });

      if (existingShop?.accessToken) {
        console.log(`[app.onboarding] found shop in database, fetching logo`);
        logoUrl = await fetchShopBrandLogo(shopParam, existingShop.accessToken);
      } else {
        console.log(`[app.onboarding] shop not found in database or no access token`);
      }
    } catch (dbError) {
      console.log(`[app.onboarding] database error`, dbError);
    }
  }

  // Fallback to session authentication
  if (!logoUrl) {
    try {
      const { session } = await authenticate.admin(request);
      const accessToken = (session as unknown as { accessToken?: string | null }).accessToken ?? null;
      const shopDomain = (session as unknown as { shop?: string | null }).shop ?? shopParam;

      console.log(`[app.onboarding] session authenticated`, {
        shopDomain,
        hasAccessToken: Boolean(accessToken),
        sessionShop: (session as unknown as { shop?: string | null }).shop,
      });

      if (shopDomain && accessToken) {
        logoUrl = await fetchShopBrandLogo(shopDomain, accessToken);
      }
    } catch (error) {
      console.log(`[app.onboarding] authenticate.admin failed`, {
        error: error instanceof Error ? error.message : error,
        shopParam,
      });
    }
  }

  console.log(`[app.onboarding] loader complete`, { logoUrl });
  return Response.json({ logoUrl });
};

export default function OnboardingPage() {
  const { logoUrl } = useLoaderData<typeof loader>();
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [productUrls, setProductUrls] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState<string | undefined>();
  const [friendlyBrands, setFriendlyBrands] = useState("");
  const [newCustomersOnly, setNewCustomersOnly] = useState(false);
  const [participateNetwork, setParticipateNetwork] = useState(true);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const productUrlsError = productUrls.trim().length > 0 ? validateProductUrls(productUrls) : "";

  const brandNameError = submissionAttempted && brandName.trim().length === 0 ? "Brand name is required." : "";

  const descriptionError = submissionAttempted && description.trim().length === 0 ? "Description is required." : "";

  const monthlyVolumeError = submissionAttempted && !monthlyVolume ? "Please select your monthly order volume." : "";

  const hasErrors =
    Boolean(brandNameError) ||
    Boolean(descriptionError) ||
    Boolean(monthlyVolumeError) ||
    Boolean(productUrlsError);

  const previewLogoUrl = logoUrl ? logoUrl : undefined;

  const formPayload = {
    brandName: brandName.trim(),
    description: description.trim(),
    productUrls: productUrls
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    monthlyVolume,
    friendlyBrands: friendlyBrands
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    newCustomersOnly,
    participateNetwork,
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionAttempted(true);
    setSaveError(null);
    setSaveSuccess(false);

    if (hasErrors) {
      return;
    }

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      setSaveError(result?.error || "Unable to save your onboarding details.");
      return;
    }

    setSaveSuccess(true);
    // TODO: trigger the next AI categorisation step after submit
    // Example: fetch("/api/onboarding/categorize", { method: "POST", ... })
  };

  return (
    <PolarisAppProvider i18n={translations}>
      <Page title="Join the Recip network">
        <Layout>
          <Layout.Section>
            <Text as="p" variant="bodyMd" color="subdued">
              Tell us a little about your brand so we can match you with the most relevant partner brands.
            </Text>
          </Layout.Section>

          <Layout.Section oneHalf>
            <form onSubmit={handleSubmit}>
              <VStack gap="6">
                <Card sectioned>
                  <VStack gap="5">
                    <Text as="h2" variant="headingMd">
                      Brand basics
                    </Text>

                    <HStack align="center" justify="space-between">
                      <HStack align="center" gap="4">
                        <LogoPreview logoUrl={previewLogoUrl} brandName={brandName || "Your brand"} />
                        <div>
                          <Text as="p" variant="headingSm">
                            Brand preview
                          </Text>
                          <Text as="p" variant="bodySm" color="subdued">
                            Your logo will appear here once your store is connected.
                          </Text>
                        </div>
                      </HStack>
                    </HStack>

                    <TextField
                      label="Brand name"
                      value={brandName}
                      onChange={setBrandName}
                      error={brandNameError}
                      requiredIndicator
                    />

                    <TextField
                      label="Describe your products"
                      value={description}
                      onChange={setDescription}
                      multiline={4}
                      helpText="In 1–3 sentences, tell us what you sell and who it’s for."
                      error={descriptionError}
                      requiredIndicator
                    />

                    <TextField
                      label="Example product URLs"
                      value={productUrls}
                      onChange={setProductUrls}
                      multiline={3}
                      helpText="Add up to 3 product links, one per line, so we can match your brand more accurately."
                      error={productUrlsError}
                    />
                  </VStack>
                </Card>

                <Card sectioned>
                  <VStack gap="5">
                    <Text as="h2" variant="headingMd">
                      Matching
                    </Text>

                    <ChoiceList
                      title="How many orders do you typically get per month?"
                      choices={volumeOptions}
                      selected={monthlyVolume ? [monthlyVolume] : []}
                      onChange={(selected) => setMonthlyVolume(selected[0])}
                      allowMultiple={false}
                      error={monthlyVolumeError}
                    />

                    <TextField
                      label="Friendly brands you'd like to be matched with"
                      value={friendlyBrands}
                      onChange={setFriendlyBrands}
                      multiline={3}
                      helpText="Add brand names, one per line. We’ll use this as a signal, but matches are still based on fit and performance."
                    />
                  </VStack>
                </Card>

                <Card sectioned>
                  <VStack gap="4">
                    <Text as="h2" variant="headingMd">
                      Offer rules
                    </Text>
                    <Checkbox
                      label="Only make my discount offers available to new customers"
                      checked={newCustomersOnly}
                      onChange={setNewCustomersOnly}
                      helpText="If enabled, Recip will create offers intended for first-time customers only."
                    />
                  </VStack>
                </Card>

                <Card sectioned>
                  <VStack gap="4">
                    <Text as="h2" variant="headingMd">
                      Network participation
                    </Text>
                    <Checkbox
                      label="Participate in the Recip network"
                      checked={participateNetwork}
                      onChange={setParticipateNetwork}
                      helpText="If turned off, your offers will stop appearing on other stores and Recip offers will no longer be shown on your store."
                    />
                  </VStack>
                </Card>

                {submissionAttempted && hasErrors ? (
                  <Banner status="critical">
                    <Text as="p">Please fix the highlighted fields before continuing.</Text>
                  </Banner>
                ) : null}

                {saveError ? (
                  <Banner status="critical">
                    <Text as="p">{saveError}</Text>
                  </Banner>
                ) : null}

                {saveSuccess ? (
                  <Banner status="success">
                    <Text as="p">Your onboarding details were saved.</Text>
                  </Banner>
                ) : null}

                <Button primary submit disabled={hasErrors}>
                  Save and continue
                </Button>
              </VStack>
            </form>
          </Layout.Section>

          <Layout.Section oneHalf>
            <div style={{ position: "sticky", top: 24 }}>
              <Card sectioned>
                <VStack gap="4">
                  <HStack align="center" justify="space-between">
                    <Text as="h2" variant="headingMd">
                      Live preview
                    </Text>
                    <Thumbnail
                      source={previewLogoUrl || "https://cdn.shopify.com/s/files/1/0262/4071/2720/files/placeholder-avatar.svg"}
                      alt={brandName || "Logo placeholder"}
                      size="small"
                    />
                  </HStack>
                  <OfferPreviewCard
                    logoUrl={previewLogoUrl}
                    brandName={brandName}
                    description={description}
                  />
                </VStack>
              </Card>

              <Card sectioned>
                <VStack gap="3">
                  <Text as="h3" variant="headingMd">
                    How Recip works
                  </Text>
                  <Text as="p" variant="bodyMd" color="subdued">
                    Recip matches your brand with the most relevant partner brands based on your website, product information, and order volume.
                  </Text>
                  <Text as="p" variant="bodySm" color="subdued">
                    After you continue, we’ll suggest a category and sub-category for your brand. You’ll be able to confirm or edit it.
                  </Text>
                </VStack>
              </Card>
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    </PolarisAppProvider>
  );
}
