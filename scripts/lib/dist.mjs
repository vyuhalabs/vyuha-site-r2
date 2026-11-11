// @ts-check
/** Helpers shared by the checks that read the built site in dist/. */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const DEFAULT_SITE_URL = "https://vyuhalabs.github.io/vyuha-site-r2";

/**
 * The site's address split into what the checks need.
 * @param {string} [siteUrl]
 */
export function siteParts(siteUrl = process.env.SITE_URL ?? DEFAULT_SITE_URL) {
  const url = new URL(siteUrl);
  const base = url.pathname.replace(/\/+$/, "");
  return { origin: url.origin, base, siteUrl: `${url.origin}${base}` };
}

/**
 * Every file under `dir`, as paths relative to it with forward slashes.
 * @param {string} dir
 * @returns {string[]}
 */
export function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full).map((p) => `${entry.name}/${p}`));
    else out.push(entry.name);
  }
  return out.map((p) => p.split(sep).join("/")).sort();
}

/** @param {string} dir @param {string} file */
export const read = (dir, file) => readFileSync(join(dir, file), "utf8");

/** @param {string} dir @param {string} file */
export const rel = (dir, file) => relative(dir, file).split(sep).join("/");

/**
 * The start tags of an HTML document with their attributes. Good enough for
 * the markup Astro emits; not a general HTML parser.
 * @param {string} html
 * @returns {{ name: string, attrs: Record<string, string>, raw: string }[]}
 */
export function tags(html) {
  const source = html.replace(/<!--[\s\S]*?-->/g, "");
  /** @type {{ name: string, attrs: Record<string, string>, raw: string }[]} */
  const out = [];
  for (const m of source.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?>/g)) {
    /** @type {Record<string, string>} */
    const attrs = {};
    const attrSource = m[2] ?? "";
    for (const a of attrSource.matchAll(
      /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
    )) {
      attrs[(a[1] ?? "").toLowerCase()] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? "");
    }
    out.push({ name: (m[1] ?? "").toLowerCase(), attrs, raw: m[0] });
  }
  return out;
}

/** @param {string} s */
export function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * The url(...) references and the import rules of a stylesheet.
 * @param {string} css
 * @returns {string[]}
 */
export function cssUrls(css) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const urls = [...source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/g)].map(
    (m) => m[1] ?? m[2] ?? m[3] ?? "",
  );
  const imports = [...source.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/g)].map(
    (m) => m[1] ?? m[2] ?? "",
  );
  return [...urls, ...imports].filter(Boolean);
}

/**
 * The CSS inside <style> elements and style="" attributes of a page.
 * @param {string} html
 */
export function inlineCss(html) {
  const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1] ?? "");
  const attrs = tags(html)
    .map((t) => t.attrs.style)
    .filter((s) => s !== undefined);
  return [...blocks, ...attrs].join("\n");
}

/**
 * The page's URL path on the site for an HTML file in dist:
 * "index.html" is "/base/", "guide/index.html" is "/base/guide/".
 * @param {string} file @param {string} base
 */
export function pagePath(file, base) {
  if (file === "index.html") return `${base}/`;
  if (file.endsWith("/index.html")) return `${base}/${file.slice(0, -"index.html".length)}`;
  return `${base}/${file}`;
}
