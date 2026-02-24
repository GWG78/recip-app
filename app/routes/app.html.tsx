import type { LoaderFunctionArgs } from "react-router";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const htmlPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
    "public",
    "index.html",
  );
  const html = await readFile(htmlPath, "utf8");

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
