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

  it("rejects headings that skip a level or start below h1", () => {
    const skipped = page({ body: "<h2>a</h2><h4>b</h4>" });
    assert.match(run({ "index.html": skipped }).join("\n"), /<h4> follows <h2>/);
    const late = page({ h1: "<h2>a</h2><h1>vyuha</h1>" });
    assert.match(run({ "index.html": late }).join("\n"), /<h2> follows no heading/);
    const fine = page({ body: "<h2>a</h2><h3>b</h3><h2>c</h2>" });
    assert.deepEqual(run({ "index.html": fine }), []);
  });

  it("rejects mailto: links", () => {
    const html = page({ body: '<a href="mailto:someone@example.org">Write</a>' });
    assert.match(run({ "index.html": html }).join("\n"), /mailto: link/);
  });

  it("holds the copy to the rules of Brand and voice", () => {
    const errors = run({
      "index.html": page({
        body: "<p>Vyuha is here!</p><p>The AI does it.</p><p>Supercharge your team.</p>",
      }),
    }).join("\n");
    assert.match(errors, /exclamation mark/);
    assert.match(errors, /"Vyuha": "vyuha" is always lowercase/);
    assert.match(errors, /"The AI": say "agents"/);
    assert.match(errors, /"Supercharge": no hype words/);
  });

  it("allows the copy rules' characters in code, markup and addresses", () => {
    const html = page({
      head: "<style>a:not(.x){color:red}</style>",
      body: '<!-- Note! --><p>vyuha and vyuhalabs/vyuha-site-r2</p><code>a != b</code><a href="https://github.com/vyuhalabs">GitHub</a>',
    });
    assert.deepEqual(run({ "index.html": html }), []);
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
