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
  const initial = (brandName.trim().charAt(0) || "?").toUpperCase();

  return (
    <div
      style={{
        width: 64,
        height: 64,
        flexShrink: 0,
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        background: "#FFFFFF",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={brandName || "Brand logo"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <span style={{ fontSize: 22, fontWeight: 700, color: "#1F2937" }}>{initial}</span>
      )}
    </div>
  );
}

function OfferPreviewCard({
  logoUrl,
  brandName,
  description,
  offerValue,
  offerType,
  newCustomersOnly,
}: {
  logoUrl?: string;
  brandName: string;
  description: string;
  offerValue?: string;
  offerType?: "percentage" | "fixed";
  newCustomersOnly?: boolean;
}) {
  const displayName = brandName.trim() || "Your brand";
  const displayDescription = description.trim() || "Your offer preview will appear here.";

  const getOfferText = () => {
    if (!offerValue) return "Your offer will appear here";
    const symbol = offerType === "percentage" ? "%" : "$";
    const offerPart = `Get ${offerValue}${symbol} off`;
    return newCustomersOnly ? `${offerPart} your first order` : offerPart;
  };

  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        padding: 16,
        background: "#FFFFFF",
      }}
    >
      {/* Header: logo + brand name + offer — mirrors s-stack direction:inline */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <LogoPreview logoUrl={logoUrl} brandName={displayName} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{displayName}</span>
          <span style={{ fontSize: 13, color: "#6B7280" }}>{getOfferText()}</span>
        </div>
      </div>

      {/* Description — mirrors s-text appearance:subdued */}
      <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
        {displayDescription}
      </p>

      {/* CTA — mirrors s-button kind:primary inlineSize:fill */}
      <Button disabled fullWidth>
        Unlock offer
      </Button>
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

async function fetchShopLogoFromAdmin(adminGraphql: any) {
  try {
    // Shopify Admin API doesn't expose brand or logo data
    // Logo must be provided manually by the user
    const response = await adminGraphql(
      `#graphql
      query {
        shop {
          name
        }
      }`
    );

    const result = await response.json();
    
    if (result?.errors?.length) {
      console.log(`[app.onboarding] shop query errors`, result.errors);
      return null;
    }

    const shopName = result?.data?.shop?.name;
    console.log(`[app.onboarding] connected to shop:`, shopName);
    return null;
  } catch (error) {
    console.log(`[app.onboarding] shop query error`, error instanceof Error ? error.message : error);
    return null;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let logoUrl: string | null = null;

  try {
    const { admin } = await authenticate.admin(request);
    logoUrl = await fetchShopLogoFromAdmin(admin.graphql);
  } catch (error) {
    console.log(`[app.onboarding] loader error:`, error);
  }

  return Response.json({ logoUrl });
};

export default function OnboardingPage() {
  const { logoUrl } = useLoaderData<typeof loader>();
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [productUrls, setProductUrls] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState<string | undefined>();
  const [friendlyBrands, setFriendlyBrands] = useState("");
  const [offerValue, setOfferValue] = useState("");
  const [offerType, setOfferType] = useState<"percentage" | "fixed">("percentage");
  const [newCustomersOnly, setNewCustomersOnly] = useState(false);
  const [participateNetwork, setParticipateNetwork] = useState(true);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userLogoUrl, setUserLogoUrl] = useState<string>(logoUrl || "");

  const productUrlsError = productUrls.trim().length > 0 ? validateProductUrls(productUrls) : "";

  const brandNameError = submissionAttempted && brandName.trim().length === 0 ? "Brand name is required." : "";

  const descriptionError = submissionAttempted && description.trim().length === 0 ? "Description is required." : "";

  const monthlyVolumeError = submissionAttempted && !monthlyVolume ? "Please select your monthly order volume." : "";

  const logoUrlError = submissionAttempted && userLogoUrl.trim().length > 0 && !urlPattern.test(userLogoUrl.trim()) ? "Logo URL must be a valid http:// or https:// address." : "";

  const hasErrors =
    Boolean(brandNameError) ||
    Boolean(descriptionError) ||
    Boolean(monthlyVolumeError) ||
    Boolean(productUrlsError) ||
    Boolean(logoUrlError);

  const previewLogoUrl = userLogoUrl.trim() || undefined;

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
    offerValue: offerValue.trim() || null,
    offerType,
    newCustomersOnly,
    participateNetwork,
    logoUrl: userLogoUrl.trim() || null,
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
              <VStack gap="2.5">
                <Card padding="500">
                  <VStack gap="2.5">
                    <Text as="h2" variant="headingMd">
                      Brand basics
                    </Text>

                    <Text as="p" variant="bodyMd" color="subdued">
                      Build your offer and preview exactly how it will be shown customers post-purchase on partner brands' sites.
                    </Text>

                    <TextField
                      label="Brand name"
                      value={brandName}
                      onChange={setBrandName}
                      error={brandNameError}
                      requiredIndicator
                      autoComplete="off"
                    />

                    <TextField
                      label="Logo URL (optional)"
                      value={userLogoUrl}
                      onChange={setUserLogoUrl}
                      helpText="Add your brand logo. You can find your logo in Shopify Admin Settings > Brand > Logo, or upload it to a CDN and paste the URL here."
                      error={logoUrlError}
                      placeholder="https://example.com/logo.png"
                      autoComplete="off"
                    />

                    <TextField
                      label="Describe your brand"
                      value={description}
                      onChange={setDescription}
                      multiline={4}
                      helpText="In 1–3 sentences, tell us what you sell and who it’s for."
                      error={descriptionError}
                      requiredIndicator
                      autoComplete="off"
                    />
                  </VStack>
                </Card>

                <Card padding="500">
                  <VStack gap="2.5">
                    <Text as="h2" variant="headingMd">
                      Your Offer
                    </Text>

                    <HStack gap="2.5" align="end">
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Discount amount"
                          value={offerValue}
                          onChange={setOfferValue}
                          placeholder="e.g., 25 or 30"
                          type="number"
                          autoComplete="off"
                        />
                      </div>
                      <div style={{ minWidth: 120 }}>
                        <ChoiceList
                          title="Type"
                          choices={[
                            { label: "Percentage (%)", value: "percentage" },
                            { label: "Fixed ($)", value: "fixed" },
                          ]}
                          selected={[offerType]}
                          onChange={(selected) => setOfferType(selected[0] as "percentage" | "fixed")}
                          allowMultiple={false}
                        />
                      </div>
                    </HStack>

                    <Checkbox
                      label="Only make my discount offers available to new customers"
                      checked={newCustomersOnly}
                      onChange={setNewCustomersOnly}
                      helpText="If enabled, Recip will create offers intended for first-time customers only."
                    />
                  </VStack>
                </Card>

                <Card padding="500">
                  <VStack gap="2.5">
                    <Text as="h2" variant="headingMd">
                      Matching
                    </Text>
                    <Text as="p" variant="bodyMd" color="subdued">
                      We use this information to connect you with complementary brands and place your offers where they're most likely to convert.
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
                      label="Example product URLs"
                      value={productUrls}
                      onChange={setProductUrls}
                      multiline={3}
                      helpText="Add up to 3 product links, one per line, so we can match your brand more accurately."
                      error={productUrlsError}
                      autoComplete="off"
                    />

                    <TextField
                      label="Friendly brands you'd like to be matched with"
                      value={friendlyBrands}
                      onChange={setFriendlyBrands}
                      multiline={3}
                      helpText="Add brand names, one per line. We’ll use this as a signal, but matches are still based on fit and performance."
                      autoComplete="off"
                    />
                  </VStack>
                </Card>

                <Card padding="500">
                  <VStack gap="2.5">
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
            <div style={{ position: "sticky", top: 0, alignSelf: "flex-start" }}>
              <Card padding="500">
                <VStack gap="2.5">
                  <HStack align="center" justify="space-between">
                    <Text as="h2" variant="headingMd">
                      Live preview
                    </Text>
                  </HStack>
                  <OfferPreviewCard
                    logoUrl={previewLogoUrl}
                    brandName={brandName}
                    description={description}
                    offerValue={offerValue}
                    offerType={offerType}
                    newCustomersOnly={newCustomersOnly}
                  />
                </VStack>
              </Card>

              <Card padding="500">
                <VStack gap="2.5">
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
