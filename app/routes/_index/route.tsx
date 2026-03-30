import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app/onboarding?${url.searchParams.toString()}`);
  }

  throw redirect("/app/onboarding");
};

export default function App() {
  return null;
}
