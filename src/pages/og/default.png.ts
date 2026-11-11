import type { APIRoute } from "astro";
import { renderOgImage } from "../../lib/og";

/** The default Open Graph image, generated when the site is built. */
export const GET: APIRoute = ({ site }) => {
  const address = new URL(import.meta.env.BASE_URL, site).href.replace(/^https?:\/\//, "");
  const png = renderOgImage({
    label: "Access by request",
    title: "A company of agents on the work your team already tracks.",
    footer: address.replace(/\/$/, ""),
  });
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
