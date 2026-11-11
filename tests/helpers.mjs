// @ts-check
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const SITE_URL = "https://vyuhalabs.github.io/vyuha-site-r2";

/**
 * Write a fake dist/ to a temporary directory.
 * @param {Record<string, string>} files path → content
 */
export function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "vyuha-dist-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

/**
 * A page that passes every check, with parts replaceable per test.
 * @param {{ path?: string, head?: string, body?: string, h1?: string }} [parts]
 */
export function page({ path = "/", head = "", body = "", h1 = "<h1>vyuha</h1>" } = {}) {
  const url = `${SITE_URL}${path}`;
  return `<!doctype html><html lang="en-GB"><head>
<title>vyuha</title>
<meta name="description" content="d">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="t"><meta property="og:description" content="d">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE_URL}/og.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="t">
<meta name="twitter:description" content="d"><meta name="twitter:image" content="${SITE_URL}/og.png">
<link rel="stylesheet" href="/vyuha-site-r2/_astro/site.css">
${head}</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<header><a href="/vyuha-site-r2/">vyuha</a></header>
<main id="main">${h1}${body}</main>
<footer><a href="https://github.com/vyuhalabs/vyuha-site-r2">Source</a></footer>
</body></html>`;
}

/** The files around a page that make a complete, passing dist/. */
export const SUPPORT = {
  "og.png": "png",
  "_astro/site.css": '@font-face{src:url("/vyuha-site-r2/_astro/f.woff2")}',
  "_astro/f.woff2": "font",
  "sitemap.xml": `<urlset><url><loc>${SITE_URL}/</loc></url></urlset>`,
  "robots.txt": `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
};
