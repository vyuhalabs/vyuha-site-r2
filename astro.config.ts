import { defineConfig } from "astro/config";
import { sitemap } from "./src/integrations/sitemap";

/**
 * The public address of the site. The deploy workflow sets SITE_URL; the
 * default is the same address, so local and CI builds use the real `base`.
 */
const SITE_URL = process.env.SITE_URL ?? "https://vyuhalabs.github.io/vyuha-site-r2";
const { origin, pathname } = new URL(SITE_URL);

export default defineConfig({
  output: "static",
  // https://vyuhalabs.github.io
  site: origin,
  // /vyuha-site-r2
  base: pathname.replace(/\/+$/, "") || "/",
  trailingSlash: "ignore",
  build: { format: "directory" },
  // Prefetch would add a client-side script.
  prefetch: false,
  devToolbar: { enabled: false },
  integrations: [sitemap({ exclude: ["/404/", "/404.html"] })],
});
