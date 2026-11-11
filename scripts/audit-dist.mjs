// @ts-check
/**
 * Audit of the built site against the rules a reviewer would otherwise check
 * by hand.
 *
 *   node scripts/audit-dist.mjs [dist]
 *
 * Site-wide: no JavaScript files, no <script> (other than JSON-LD data), no
 * inline event handlers, nothing loaded from another origin (stylesheets,
 * fonts, images, frames, preconnects, CSS url()), no Set-Cookie meta;
 * sitemap.xml lists every indexable page and robots.txt points at it.
 * Per page: lang, one h1, headings that start at h1 and skip no level,
 * header/main/footer landmarks, a skip link to main as the first focusable
 * element, no mailto: link, the SEO head (title, description, canonical, Open
 * Graph, Twitter card), and the copy rules of "Brand and voice" (no
 * exclamation marks, "vyuha" lowercase, never "the AI" or "the bot", no hype
 * words).
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cssUrls,
  inlineCss,
  pagePath,
  read,
  siteParts,
  tags,
  visibleText,
  walk,
} from "./lib/dist.mjs";

/** Elements and attributes through which a page makes a request. */
const LOADING = [
  ["script", "src"],
  ["img", "src"],
  ["img", "srcset"],
  ["source", "src"],
  ["source", "srcset"],
  ["video", "src"],
  ["video", "poster"],
  ["audio", "src"],
  ["track", "src"],
  ["iframe", "src"],
  ["embed", "src"],
  ["object", "data"],
  ["input", "src"],
];
/** link rel values that make the browser fetch or connect. */
const LOADING_RELS = new Set([
  "stylesheet",
  "preload",
  "modulepreload",
  "prefetch",
  "preconnect",
  "dns-prefetch",
  "icon",
  "apple-touch-icon",
  "manifest",
  "mask-icon",
]);
const FOCUSABLE = new Set(["a", "button", "input", "select", "textarea", "summary", "iframe"]);

/**
 * Words "Brand and voice" rules out, as patterns over the page's text: the
 * name in any case but lowercase, the product called "the AI" or "the bot",
 * and hype.
 */
const COPY_RULES = [
  { pattern: /\b(?!vyuha\b)[vV][yY][uU][hH][aA]\b/, rule: '"vyuha" is always lowercase' },
  { pattern: /\bthe (AI|bot)\b/i, rule: 'say "agents", never "the AI" or "the bot"' },
  {
    pattern:
      /\b(revolutionary|revolutioni[sz]e|10x|magic(al)?|supercharge[ds]?|game[- ]chang(er|ing)|cutting[- ]edge|next[- ]gen|blazing(ly)?|unleash|seamless(ly)?|effortless(ly)?|world[- ]class)\b/i,
    rule: "no hype words",
  },
];

/**
 * @param {{ dist: string, siteUrl?: string }} options
 * @returns {{ pages: number, errors: string[] }}
 */
export function auditDist({ dist, siteUrl }) {
  const { origin, base, siteUrl: site } = siteParts(siteUrl);
  const files = walk(dist);
  /** @type {string[]} */
  const errors = [];

  /** @param {string} file @param {string} ref */
  const external = (file, ref) => {
    if (/^(data|blob):/i.test(ref)) return;
    const url = new URL(ref, `${origin}${base}/${file}`);
    if (url.origin !== origin) errors.push(`${file}: loads "${ref}" from another origin`);
  };

  for (const file of files) {
    if (/\.(m?js|cjs|wasm)$/.test(file)) errors.push(`${file}: JavaScript in dist`);
    if (file.endsWith(".css")) for (const ref of cssUrls(read(dist, file))) external(file, ref);
  }

  /** @type {string[]} */
  const indexable = [];
  const pages = files.filter((f) => f.endsWith(".html"));

  for (const file of pages) {
    const html = read(dist, file);
    const all = tags(html);
    /** @param {string} name */
    const count = (name) => all.filter((t) => t.name === name).length;
    /** @param {string} key */
    const meta = (key) =>
      all.find((t) => t.name === "meta" && (t.attrs.property === key || t.attrs.name === key))
        ?.attrs.content;

    // No client-side JavaScript, no third-party requests, no cookies.
    for (const t of all) {
      if (t.name === "script" && t.attrs.type !== "application/ld+json") {
        errors.push(`${file}: <script> element`);
      }
      for (const attr of Object.keys(t.attrs)) {
        if (/^on[a-z]+$/.test(attr)) errors.push(`${file}: inline handler ${attr} on <${t.name}>`);
      }
      if (/^javascript:/i.test(t.attrs.href ?? "")) errors.push(`${file}: javascript: URL`);
      if (t.name === "meta" && (t.attrs["http-equiv"] ?? "").toLowerCase() === "set-cookie") {
        errors.push(`${file}: sets a cookie`);
      }
      for (const [name, attr] of LOADING) {
        const value = t.name === name && attr ? t.attrs[attr] : undefined;
        if (value === undefined) continue;
        const refs = attr?.endsWith("srcset")
          ? value.split(",").map((c) => c.trim().split(/\s+/)[0] ?? "")
          : [value];
        for (const ref of refs.filter(Boolean)) external(file, ref);
      }
      if (t.name === "link" && t.attrs.href) {
        const rels = (t.attrs.rel ?? "").toLowerCase().split(/\s+/);
        if (rels.some((r) => LOADING_RELS.has(r))) external(file, t.attrs.href);
      }
    }
    for (const ref of cssUrls(inlineCss(html))) external(file, ref);

    // Landmarks, headings, skip link.
    const htmlTag = all.find((t) => t.name === "html");
    if (!htmlTag?.attrs.lang) errors.push(`${file}: <html> has no lang`);
    if (count("h1") !== 1) errors.push(`${file}: ${count("h1")} h1 elements, expected 1`);
    let level = 0;
    for (const t of all.filter((t) => /^h[1-6]$/.test(t.name))) {
      const next = Number(t.name.slice(1));
      if (next > level + 1) {
        errors.push(`${file}: <${t.name}> follows ${level ? `<h${level}>` : "no heading"}`);
      }
      level = next;
    }
    if (count("main") !== 1) errors.push(`${file}: ${count("main")} <main> landmarks, expected 1`);
    if (count("header") < 1) errors.push(`${file}: no <header> landmark`);
    if (count("footer") < 1) errors.push(`${file}: no <footer> landmark`);
    const mainId = all.find((t) => t.name === "main")?.attrs.id;
    const firstFocusable = all.find(
      (t) => FOCUSABLE.has(t.name) && (t.name !== "a" || t.attrs.href !== undefined),
    );
    if (!mainId || firstFocusable?.name !== "a" || firstFocusable.attrs.href !== `#${mainId}`) {
      errors.push(`${file}: the first focusable element is not a skip link to <main>`);
    }

    // No mailto: there is no role address to write to.
    if (all.some((t) => /^mailto:/i.test(t.attrs.href ?? ""))) {
      errors.push(`${file}: mailto: link`);
    }

    // Copy rules of "Brand and voice".
    const text = visibleText(html);
    if (visibleText(html, { withoutCode: true }).includes("!")) {
      errors.push(`${file}: exclamation mark in the copy`);
    }
    for (const { pattern, rule } of COPY_RULES) {
      const hit = text.match(pattern);
      if (hit) errors.push(`${file}: "${hit[0]}": ${rule}`);
    }

    // SEO head.
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
    if (!title) errors.push(`${file}: no <title>`);
    if (!meta("description")) errors.push(`${file}: no meta description`);
    const canonical = all.find((t) => t.name === "link" && t.attrs.rel === "canonical")?.attrs.href;
    const expected = `${origin}${pagePath(file, base)}`;
    if (canonical !== expected) {
      errors.push(`${file}: canonical is "${canonical ?? ""}", expected "${expected}"`);
    }
    for (const key of [
      "og:title",
      "og:description",
      "og:url",
      "og:image",
      "og:type",
      "twitter:card",
      "twitter:title",
      "twitter:description",
      "twitter:image",
    ]) {
      if (!meta(key)) errors.push(`${file}: no ${key}`);
    }
    if (meta("og:url") !== canonical) errors.push(`${file}: og:url differs from the canonical`);
    if (!(meta("robots") ?? "").includes("noindex")) indexable.push(expected);
  }

  // sitemap.xml and robots.txt.
  if (!files.includes("sitemap.xml")) {
    errors.push("sitemap.xml is missing");
  } else {
    const locs = [...read(dist, "sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const url of indexable) {
      if (!locs.includes(url)) errors.push(`sitemap.xml does not list ${url}`);
    }
    for (const url of locs) {
      if (!url?.startsWith(`${site}/`)) errors.push(`sitemap.xml lists ${url}, not on ${site}`);
      else if (!indexable.includes(url))
        errors.push(`sitemap.xml lists ${url}, not an indexable page`);
    }
  }
  if (!files.includes("robots.txt")) {
    errors.push("robots.txt is missing");
  } else if (!read(dist, "robots.txt").includes(`Sitemap: ${site}/sitemap.xml`)) {
    errors.push(`robots.txt does not point at ${site}/sitemap.xml`);
  }

  return { pages: pages.length, errors };
}

function main() {
  const dist = resolve(process.argv[2] ?? "dist");
  if (!existsSync(dist)) {
    console.error(`${dist} does not exist: build the site first`);
    process.exit(2);
  }
  const { siteUrl } = siteParts();
  const { pages, errors } = auditDist({ dist, siteUrl });
  for (const e of errors) console.error(`✗ ${e}`);
  if (errors.length > 0 || pages === 0) {
    console.error(`audit-dist: ${errors.length} problem(s) in ${pages} page(s)`);
    process.exit(1);
  }
  console.log(
    `audit-dist: ${pages} page(s): no JavaScript, no third-party requests, no cookies; landmarks, one h1, headings in order, skip link, SEO head and the copy rules on every page; no mailto; sitemap and robots agree`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
