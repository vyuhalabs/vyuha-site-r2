// @ts-check
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditDist } from "../scripts/audit-dist.mjs";
import { fixture, page, SITE_URL, SUPPORT } from "./helpers.mjs";

/** @param {Record<string, string>} files */
const run = (files) =>
  auditDist({ dist: fixture({ ...SUPPORT, "index.html": page(), ...files }), siteUrl: SITE_URL })
    .errors;

describe("audit-dist", () => {
  it("passes a page that follows every rule", () => {
    assert.deepEqual(run({}), []);
  });

  it("rejects JavaScript files and script elements", () => {
    const errors = run({
      "_astro/app.js": "console.log(1)",
      "index.html": page({ body: "<script>document.cookie='a=b'</script>" }),
    }).join("\n");
    assert.match(errors, /_astro\/app\.js: JavaScript in dist/);
    assert.match(errors, /<script> element/);
  });

  it("allows JSON-LD data", () => {
    const html = page({ head: '<script type="application/ld+json">{}</script>' });
    assert.deepEqual(run({ "index.html": html }), []);
  });

  it("rejects inline event handlers", () => {
    const html = page({ body: '<button onclick="x()">x</button>' });
    assert.match(run({ "index.html": html }).join("\n"), /inline handler onclick/);
  });

  it("rejects requests to other origins", () => {
    const errors = run({
      "index.html": page({
        head: '<link rel="preconnect" href="https://fonts.gstatic.com"><style>body{background:url(https://cdn.example/x.png)}</style>',
        body: '<img alt="" src="https://example.org/a.png">',
      }),
      "_astro/site.css": '@import "https://fonts.googleapis.com/css2?family=X";',
    }).join("\n");
    assert.match(errors, /fonts\.gstatic\.com/);
    assert.match(errors, /cdn\.example/);
    assert.match(errors, /example\.org\/a\.png/);
    assert.match(errors, /fonts\.googleapis\.com/);
  });

  it("allows plain links to other sites", () => {
    const html = page({ body: '<a href="https://github.com/vyuhalabs/vyuha-site-r2">x</a>' });
    assert.deepEqual(run({ "index.html": html }), []);
  });

  it("rejects a page without exactly one h1", () => {
    assert.match(run({ "index.html": page({ h1: "" }) }).join("\n"), /0 h1 elements/);
    const two = page({ h1: "<h1>a</h1><h1>b</h1>" });
    assert.match(run({ "index.html": two }).join("\n"), /2 h1 elements/);
  });

  it("rejects a page whose first focusable element is not the skip link", () => {
    const html = page().replace('<a class="skip-link" href="#main">Skip to content</a>', "");
    assert.match(run({ "index.html": html }).join("\n"), /not a skip link/);
  });

  it("rejects a page with a missing landmark", () => {
    const html = page().replace(/<footer>.*<\/footer>/, "");
    assert.match(run({ "index.html": html }).join("\n"), /no <footer> landmark/);
  });

  it("rejects a wrong canonical and missing social cards", () => {
    const html = page()
      .replace(`href="${SITE_URL}/"`, `href="${SITE_URL}/other/"`)
      .replace(/<meta name="twitter:card"[^>]*>/, "");
    const errors = run({ "index.html": html }).join("\n");
    assert.match(errors, /canonical is .*other/);
    assert.match(errors, /no twitter:card/);
  });

  it("requires the sitemap to list every indexable page and nothing else", () => {
    const errors = run({
      "guide/index.html": page({ path: "/guide/" }),
      "404.html": page({ path: "/404.html", head: '<meta name="robots" content="noindex">' }),
    }).join("\n");
    assert.match(errors, /sitemap\.xml does not list .*\/guide\//);
    assert.doesNotMatch(errors, /404/);
  });

  it("requires robots.txt to point at the sitemap", () => {
    assert.match(run({ "robots.txt": "User-agent: *\n" }).join("\n"), /robots\.txt does not point/);
  });
});
