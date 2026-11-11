// @ts-check
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkLinks } from "../scripts/check-links.mjs";
import { fixture, page, SITE_URL, SUPPORT } from "./helpers.mjs";

/** @param {Record<string, string>} files */
const run = (files) => checkLinks({ dist: fixture({ ...SUPPORT, ...files }), siteUrl: SITE_URL });

describe("check-links", () => {
  it("passes a site whose links and assets resolve under the base", () => {
    const { errors, checked } = run({
      "index.html": page({ body: '<a href="/vyuha-site-r2/guide/#steps">Guide</a>' }),
      "guide/index.html": page({ path: "/guide/", body: '<h2 id="steps">Steps</h2>' }),
    });
    assert.deepEqual(errors, []);
    assert.ok(checked >= 8, `checked ${checked}`);
  });

  it("rejects a root-relative link that lacks the base", () => {
    const { errors } = run({ "index.html": page({ body: '<a href="/guide/">Guide</a>' }) });
    assert.match(errors.join("\n"), /"\/guide\/" is outside the base \/vyuha-site-r2/);
  });

  it("rejects a link to a page that was not built", () => {
    const { errors } = run({
      "index.html": page({ body: '<a href="/vyuha-site-r2/faq/">FAQ</a>' }),
    });
    assert.match(errors.join("\n"), /"\/vyuha-site-r2\/faq\/" does not resolve/);
  });

  it("rejects a fragment with no matching id", () => {
    const { errors } = run({ "index.html": page({ body: '<a href="#nowhere">x</a>' }) });
    assert.match(errors.join("\n"), /no element with id "nowhere"/);
  });

  it("resolves relative links against the page", () => {
    const { errors } = run({
      "index.html": page(),
      "guide/index.html": page({
        path: "/guide/",
        body: '<a href="../">Home</a><a href="next/">x</a>',
      }),
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0] ?? "", /"next\/" does not resolve/);
  });

  it("checks url() in stylesheets", () => {
    const { errors } = run({
      "index.html": page(),
      "_astro/site.css": '@font-face{src:url("/vyuha-site-r2/_astro/missing.woff2")}',
    });
    assert.match(errors.join("\n"), /missing\.woff2" does not resolve/);
  });

  it("checks srcset candidates and Open Graph URLs", () => {
    const { errors } = run({
      "index.html": page({
        head: `<meta property="og:image" content="${SITE_URL}/missing.png">`,
        body: '<img alt="" srcset="/vyuha-site-r2/og.png 1x, /vyuha-site-r2/two.png 2x">',
      }),
    });
    const all = errors.join("\n");
    assert.match(all, /two\.png" does not resolve/);
    assert.match(all, /missing\.png" does not resolve/);
  });

  it("rejects a canonical link on another address", () => {
    const { errors } = run({
      "index.html": page({
        head: '<link rel="canonical" href="https://vyuhalabs.github.io/vyuha-site/">',
      }),
    });
    assert.match(
      errors.join("\n"),
      /canonical .* is not on https:\/\/vyuhalabs\.github\.io\/vyuha-site-r2/,
    );
  });

  it("does not follow links to other sites", () => {
    const { errors } = run({
      "index.html": page({ body: '<a href="https://example.org/x">x</a>' }),
    });
    assert.deepEqual(errors, []);
  });
});
