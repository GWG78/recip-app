import { useLocation } from "react-router";

export default function Index() {
  const { search } = useLocation();
  const src = `/app/html${search}`;

  return (
    <iframe
      src={src}
      title="Recip settings"
      style={{
        border: "none",
        width: "100%",
        height: "calc(100vh - 60px)",
      }}
    />
  );
}
