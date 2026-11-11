// @ts-check
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { contrast, evaluate, PAIRS, parseTokens, render } from "../scripts/contrast.mjs";

const tokensCss = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const table = readFileSync(new URL("../docs/contrast.md", import.meta.url), "utf8");

describe("contrast", () => {
  it("computes WCAG ratios", () => {
    assert.equal(contrast("#000000", "#ffffff"), 21);
    assert.equal(contrast("#fff", "#fff"), 1);
    // Reference: WebAIM gives 5.02:1 for #B45309 on white.
    assert.equal(contrast("#b45309", "#ffffff").toFixed(2), "5.02");
  });

  it("reads the brief's accent in both themes", () => {
    const tokens = parseTokens(tokensCss);
    assert.equal(tokens.light.accent, "#b45309");
    assert.equal(tokens.dark.accent, "#f59e0b");
  });

  it("keeps every text pair at 4.5:1 or more and every non-text pair at 3:1 or more", () => {
    const rows = evaluate(parseTokens(tokensCss));
    assert.equal(rows.length, PAIRS.length * 2);
    const failing = rows.filter((r) => !r.pass).map((r) => `${r.theme} ${r.fg}/${r.bg}`);
    assert.deepEqual(failing, []);
    for (const r of rows.filter((x) => x.kind === "text")) assert.ok(r.ratio >= 4.5);
  });

  it("matches docs/contrast.md (run `pnpm contrast` after changing a colour)", () => {
    assert.equal(table, render(evaluate(parseTokens(tokensCss))));
  });
});
