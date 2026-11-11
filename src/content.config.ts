/**
 * Content collections. `docs` holds the sections of the model page and the
 * getting-started guide, one Markdown file per section; `faq` holds one
 * question and its answer per file. `astro check` validates every file
 * against these schemas, so a missing field or a question without its
 * question mark fails the build.
 */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

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

export const collections = { docs, faq };
