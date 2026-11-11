/**
 * Writes dist/sitemap.xml once the build is done: every HTML page Astro
 * generated, as an absolute URL under `site` and `base`, minus `exclude`.
 * A single file at the address the brief names, with no dependency.
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

interface Options {
  /** Page paths without the base, e.g. "/404/". */
  exclude?: string[];
}

export function sitemap({ exclude = [] }: Options = {}): AstroIntegration {
  let site: URL | undefined;
  let base = "/";

  return {
    name: "vyuha:sitemap",
    hooks: {
      "astro:config:done": ({ config }) => {
        if (!config.site) throw new Error("vyuha:sitemap needs `site` in astro.config");
        site = new URL(config.site);
        base = config.base.endsWith("/") ? config.base : `${config.base}/`;
      },
      "astro:build:done": ({ dir, pages, logger }) => {
        if (!site) return;
        const out = fileURLToPath(dir);
        const skip = new Set(exclude.map((p) => p.replace(/^\/+|\/+$/g, "")));
        const urls = pages
          .map(({ pathname }) => pathname.replace(/^\/+|\/+$/g, ""))
          .filter((p) => !skip.has(p))
          .filter((p) => existsSync(join(out, p, "index.html")))
          .map((p) => new URL(p ? `${base}${p}/` : base, site).href)
          .sort();
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
          "</urlset>",
          "",
        ].join("\n");
        writeFileSync(join(out, "sitemap.xml"), xml);
        logger.info(`sitemap.xml: ${urls.length} page(s)`);
      },
    },
  };
}
