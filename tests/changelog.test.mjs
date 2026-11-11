// @ts-check
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseChangelog } from "../src/lib/changelog.mjs";

const HEAD = "# Changelog\n\nAll notable changes.\n\n";

describe("parseChangelog", () => {
  it("reads each release's version, date and notes, newest first", () => {
    const releases = parseChangelog(
      `${HEAD}## 0.2.0 - 2026-12-01\n\n### Pages\n\n- Changelog page.\n\n## 0.1.0 - 2026-11-11\n\nThe first release.\n`,
    );
    assert.deepEqual(releases, [
      { version: "0.2.0", date: "2026-12-01", body: "### Pages\n\n- Changelog page." },
      { version: "0.1.0", date: "2026-11-11", body: "The first release." },
    ]);
  });

  it("accepts Keep a Changelog's linked headings and leaves out Unreleased", () => {
    const releases = parseChangelog(
      `${HEAD}## [Unreleased]\n\n- Not out yet.\n\n## [1.0.0-rc.1] - 2026-12-01\n\n- Out.\n\n[1.0.0-rc.1]: https://example.com\n`,
    );
    assert.deepEqual(
      releases.map((r) => r.version),
      ["1.0.0-rc.1"],
    );
  });

  it("does not take a ## line inside a code block for a release", () => {
    const releases = parseChangelog(
      `${HEAD}## 0.1.0 - 2026-11-11\n\n\`\`\`md\n## not a release\n\`\`\`\n`,
    );
    assert.equal(releases.length, 1);
    assert.match(releases[0]?.body ?? "", /## not a release/);
  });

  it("fails on a heading that is not a version and a date", () => {
    assert.throws(() => parseChangelog(`${HEAD}## 0.1.0\n\n- No date.\n`), /CHANGELOG\.md:5/);
    assert.throws(() => parseChangelog(`${HEAD}## v0.1 - 2026-11-11\n`), /is not "## <version>/);
    assert.throws(() => parseChangelog(`${HEAD}## 0.1.0 - 2026-13-45\n`), /is not a date/);
    assert.throws(() => parseChangelog(`${HEAD}## 0.1.0 - 2026-02-30\n`), /is not a date/);
  });

  it("fails on a release listed twice or out of order", () => {
    assert.throws(
      () => parseChangelog(`${HEAD}## 0.1.0 - 2026-11-11\n\n## 0.1.0 - 2026-11-11\n`),
      /listed twice/,
    );
    assert.throws(
      () => parseChangelog(`${HEAD}## 0.1.0 - 2026-11-11\n\n## 0.2.0 - 2026-12-01\n`),
      /newest first/,
    );
  });

  it("reads the repository's CHANGELOG.md", () => {
    const text = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
    const releases = parseChangelog(text);
    assert.ok(releases.length >= 1);
    const first = releases.find((r) => r.version === "0.1.0");
    assert.equal(first?.date, "2026-11-11");
    assert.match(first?.body ?? "", /^### Pages$/m);
  });
});
