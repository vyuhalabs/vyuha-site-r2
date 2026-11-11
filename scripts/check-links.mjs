// @ts-check
/**
 * Internal link check over the built site.
 *
 *   node scripts/check-links.mjs [dist]
 *
 * Every link and asset reference in dist/ (href, src, srcset, poster, the
 * Open Graph and canonical URLs, url() in CSS) that points at this site must
 * resolve to a file in dist/ under the real `base`, and every #fragment to an
 * id on the target page. A root-relative URL without the base is an error:
 * it works on a dev server and breaks on GitHub Pages. Links to other sites
 * are not followed (the check runs offline).
 */
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cssUrls, inlineCss, pagePath, read, siteParts, tags, walk } from "./lib/dist.mjs";

const URL_ATTRS = ["href", "src", "poster", "action", "data"];
const META_URLS = new Set(["og:url", "og:image", "twitter:image", "twitter:url"]);

/**
 * @param {{ dist: string, siteUrl?: string }} options
 * @returns {{ checked: number, errors: string[] }}
 */
export function checkLinks({ dist, siteUrl }) {
  const { origin, base, siteUrl: site } = siteParts(siteUrl);
  const files = walk(dist);
  /** @type {Map<string, Set<string>>} ids per HTML file, read lazily */
  const idCache = new Map();
  /** @type {string[]} */
  const errors = [];
  let checked = 0;

  /** @param {string} file */
  const idsOf = (file) => {
    let ids = idCache.get(file);
    if (!ids) {
      ids = new Set();
      for (const t of tags(read(dist, file))) {
        if (t.attrs.id) ids.add(t.attrs.id);
        if (t.name === "a" && t.attrs.name) ids.add(t.attrs.name);
      }
      idCache.set(file, ids);
    }
    return ids;
  };

  /**
   * The file in dist that serves a URL path under the base, as GitHub Pages
   * resolves it, or undefined.
   * @param {string} path
   */
  const target = (path) => {
    const inside = decodeURIComponent(path.slice(base.length)).replace(/^\/+/, "");
    const candidates =
      inside === "" || inside.endsWith("/")
        ? [`${inside}index.html`]
        : [inside, `${inside}/index.html`, `${inside}.html`];
    return candidates.find((c) => {
      const full = join(dist, c);
      return existsSync(full) && statSync(full).isFile();
    });
  };

  /**
   * @param {string} from the dist file the reference is in
   * @param {string} raw the reference as written
   * @param {string} pageUrl the URL the reference is resolved against
   */
  const check = (from, raw, pageUrl) => {
    const ref = raw.trim();
    if (ref === "" || /^(mailto|tel|data|blob):/i.test(ref)) return;
    if (/^javascript:/i.test(ref)) {
      errors.push(`${from}: javascript: URL "${ref}"`);
      return;
    }
    const url = new URL(ref, pageUrl);
    if (url.origin !== origin) return; // another site: not followed
    checked++;
    const path = url.pathname;
    if (path !== base && !path.startsWith(`${base}/`)) {
      errors.push(`${from}: "${ref}" is outside the base ${base || "/"}`);
      return;
    }
    const file = target(path);
    if (!file) {
      errors.push(`${from}: "${ref}" does not resolve to a file in dist`);
      return;
    }
    const fragment = decodeURIComponent(url.hash.slice(1));
    if (fragment && file.endsWith(".html") && !idsOf(file).has(fragment)) {
      errors.push(`${from}: "${ref}" has no element with id "${fragment}"`);
    }
  };

  for (const file of files) {
    if (file.endsWith(".html")) {
      const html = read(dist, file);
      const pageUrl = `${origin}${pagePath(file, base)}`;
      for (const t of tags(html)) {
        for (const attr of URL_ATTRS) {
          const value = t.attrs[attr];
          if (value !== undefined && (attr !== "data" || t.name === "object")) {
            check(file, value, pageUrl);
          }
        }
        for (const attr of ["srcset", "imagesrcset"]) {
          for (const candidate of (t.attrs[attr] ?? "").split(",")) {
            const src = candidate.trim().split(/\s+/)[0];
            if (src) check(file, src, pageUrl);
          }
        }
        const key = t.attrs.property ?? t.attrs.name;
        if (t.name === "meta" && key && META_URLS.has(key) && t.attrs.content) {
          if (!t.attrs.content.startsWith(site)) {
            errors.push(`${file}: ${key} "${t.attrs.content}" is not on ${site}`);
          } else {
            check(file, t.attrs.content, pageUrl);
          }
        }
        if (t.name === "link" && t.attrs.rel === "canonical" && t.attrs.href) {
          if (!t.attrs.href.startsWith(`${site}/`)) {
            errors.push(`${file}: canonical "${t.attrs.href}" is not on ${site}`);
          }
        }
      }
      for (const ref of cssUrls(inlineCss(html))) check(file, ref, pageUrl);
    } else if (file.endsWith(".css")) {
      const cssUrl = `${origin}${base}/${file}`;
      for (const ref of cssUrls(read(dist, file))) check(file, ref, cssUrl);
    }
  }
  return { checked, errors };
}

function main() {
  const dist = resolve(process.argv[2] ?? "dist");
  if (!existsSync(dist)) {
    console.error(`${dist} does not exist: build the site first`);
    process.exit(2);
  }
  const { siteUrl } = siteParts();
  const { checked, errors } = checkLinks({ dist, siteUrl });
  for (const e of errors) console.error(`✗ ${e}`);
  if (errors.length > 0) {
    console.error(`check-links: ${errors.length} broken of ${checked} internal references`);
    process.exit(1);
  }
  if (checked === 0) {
    console.error("check-links: found no internal references; is this the right directory?");
    process.exit(1);
  }
  console.log(`check-links: ${checked} internal references resolve under ${siteUrl}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
