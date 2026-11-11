import type { APIRoute, GetStaticPaths } from "astro";
import { renderOgImage } from "../../lib/og";

/** The Open Graph image of each page, generated when the site is built. */
const CARDS = {
  default: {
    label: "Access by request",
    title: "A company of agents on the work your team already tracks.",
  },
  model: {
    label: "The model",
    title: "Work, agents, decisions, evidence, playbooks, pods and budgets.",
  },
  guide: {
    label: "Guide",
    title: "Connect a repository, create a project, file a first issue, read the evidence.",
  },
  faq: {
    label: "FAQ",
    title: "What people ask first about vyuha.",
  },
} as const;

export const getStaticPaths = (() =>
  Object.keys(CARDS).map((slug) => ({ params: { slug } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params, site }) => {
  const card = CARDS[params.slug as keyof typeof CARDS];
  if (!card) return new Response(null, { status: 404 });
  const address = new URL(import.meta.env.BASE_URL, site).href.replace(/^https?:\/\//, "");
  const png = renderOgImage({ ...card, footer: address.replace(/\/$/, "") });
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
