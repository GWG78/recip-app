import { useLocation, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return Response.json({});
};

export default function Home() {
  const location = useLocation();
  const search = location.search || "";

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>Welcome to Recip</h1>
      <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 24 }}>
        This is your home landing page. Use the onboarding flow to connect your brand and configure your first partner offers.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href={`/app/onboarding${search}`}
          style={{
            display: "inline-block",
            padding: "12px 20px",
            borderRadius: 10,
            background: "#00695c",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go to onboarding
        </a>
        <a
          href={`/app/additional${search}`}
          style={{
            display: "inline-block",
            padding: "12px 20px",
            borderRadius: 10,
            background: "#f4f6f8",
            color: "#111827",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          View additional page
        </a>
      </div>
    </div>
  );
}
