/** Facts about the site that more than one page or component uses. */

export const SITE = {
  name: "vyuha",
  description:
    "vyuha runs a company of agents on the work your team already tracks. Every run leaves evidence that a person or a reviewer agent checks, and you stay in control of decisions, budgets and spend.",
  locale: "en_GB",
  lang: "en-GB",
  repository: "https://github.com/vyuhalabs/vyuha-site-r2",
  accessRequest: "https://github.com/vyuhalabs/vyuha-site-r2/issues/new?template=access-request.md",
} as const;

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

/**
 * A root-relative URL under the site's `base`: href("/") is "/vyuha-site-r2/",
 * href("/guide/") is "/vyuha-site-r2/guide/". Every internal link and asset
 * goes through it, so a missing base cannot slip in.
 */
export function href(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${clean}`;
}

/**
 * The absolute URL on the live site of a path given without the base:
 * absoluteUrl("/og/default.png") is
 * "https://vyuhalabs.github.io/vyuha-site-r2/og/default.png".
 */
export function absoluteUrl(path = "/"): string {
  const site = import.meta.env.SITE;
  if (!site) throw new Error("astro.config: `site` is not set");
  return new URL(href(path), site).href;
}
