// @ts-check
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = new URL("../src/content/", import.meta.url).pathname;

/** @param {string} dir @returns {{ file: string, text: string }[]} */
function filesIn(dir) {
  return readdirSync(join(root, dir), { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ file: `${dir}/${f}`, text: readFileSync(join(root, dir, f), "utf8") }));
}

const faq = filesIn("faq");
const docs = filesIn("docs");

/** The rule of the brief, word for word. */
const MERGE_RULE =
  "vyuha merges after review and verification, and the decision tier says whether a person approves first or may object.";

describe("content", () => {
  it("has 6 to 10 FAQ questions, each a question", () => {
    assert.ok(faq.length >= 6 && faq.length <= 10, `${faq.length} questions`);
    for (const { file, text } of faq) {
      assert.match(text, /^question: "[^"]+\?"$/m, file);
    }
  });

  it("explains the seven ideas of the model, one section each", () => {
    const titles = docs
      .filter((d) => d.file.startsWith("docs/model/"))
      .map((d) => d.text.match(/^title: "(.+)"$/m)?.[1]);
    assert.deepEqual(
      titles.sort(),
      ["Agents", "Budgets", "Decisions", "Evidence", "Playbooks", "Pods", "Work"].sort(),
    );
  });

  it("states the merge rule exactly wherever merging is mentioned", () => {
    for (const { file, text } of [...faq, ...docs]) {
      const body = text.replace(/^---[\s\S]*?\n---\n/, "").replace(/\s+/g, " ");
      const talksOfMerging = /\bmerg(e|es|ed|ing)\b/i.test(body);
      if (!talksOfMerging) continue;
      const mentionsInRule = body.split(MERGE_RULE).join("");
      // Every other mention of merging may only be about the checks before a merge, not about who merges.
      assert.ok(
        body.includes(MERGE_RULE) || !/\bmerges\b/i.test(body),
        `${file} says who merges without the rule`,
      );
      assert.doesNotMatch(mentionsInRule, /\bvyuha merges\b/i, `${file} restates the rule loosely`);
    }
  });

  it("does not repeat run 1's unsettled line", () => {
    for (const { file, text } of [...faq, ...docs]) {
      assert.doesNotMatch(text, /only when you let it/i, file);
    }
  });

  it("says access is by request in the guide and the FAQ", () => {
    const guide = docs
      .filter((d) => d.file.startsWith("docs/guide/"))
      .map((d) => d.text)
      .join("\n");
    assert.match(guide, /access is by request/i);
    assert.match(guide, /issues\/new\?template=access-request\.md/);
    assert.match(faq.map((f) => f.text).join("\n"), /access is by request/i);
  });
});
