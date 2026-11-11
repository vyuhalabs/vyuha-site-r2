/**
 * Content collections. `docs` holds the sections of the model page and the
 * getting-started guide, one Markdown file per section; `faq` holds one
 * question and its answer per file. `astro check` validates every file
 * against these schemas, so a missing field or a question without its
 * question mark fails the build. `changelog` holds the releases of
 * CHANGELOG.md, read by src/lib/changelog.mjs.
 */

import { defineCollection } from "astro:content";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { parseChangelog } from "./lib/changelog.mjs";

export const ILLUSTRATIONS = ["project", "run", "decisions", "inbox"] as const;

const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    /** The page the section belongs to. */
    page: z.enum(["model", "guide"]),
    /** Position on the page, from 1. */
    order: z.number().int().positive(),
    /** Shown above the heading: a number or a step, e.g. "01" or "Step 2". */
    label: z.string().min(2).max(24),
    /** The section's h2, and its entry in "On this page". */
    title: z.string().min(2).max(60),
    /** One or two sentences under the heading. */
    summary: z.string().min(30).max(220),
    /** Drawings of the product shown under the section (see src/components/illustrations). */
    illustrations: z.array(z.enum(ILLUSTRATIONS)).max(2).default([]),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faq" }),
  schema: z.object({
    /** The question, as a person would ask it. */
    question: z.string().min(8).max(100).regex(/\?$/, "A question ends with a question mark"),
    /** Position on the page, from 1. */
    order: z.number().int().positive(),
  }),
});

const CHANGELOG = fileURLToPath(new URL("../CHANGELOG.md", import.meta.url));

/**
 * The releases in CHANGELOG.md, one entry per release, newest first. The
 * file stays the one source: the page renders each release's notes as they
 * are written there.
 */
const changelog = defineCollection({
  loader: {
    name: "vyuha:changelog",
    load: async ({ store, parseData, renderMarkdown, watcher }) => {
      watcher?.add(CHANGELOG);
      const releases = parseChangelog(await readFile(CHANGELOG, "utf8"));
      store.clear();
      for (const [index, release] of releases.entries()) {
        const { version, date, body } = release;
        const data = await parseData({ id: version, data: { version, date, order: index + 1 } });
        store.set({ id: version, data, body, rendered: await renderMarkdown(body) });
      }
    },
  },
  schema: z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/),
    /** The release date, YYYY-MM-DD, as written in CHANGELOG.md. */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Position on the page, from 1 (the newest). */
    order: z.number().int().positive(),
  }),
});

export const collections = { docs, faq, changelog };
