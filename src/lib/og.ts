/**
 * Open Graph images, rendered at build time: an SVG drawn here is rasterised
 * to PNG by resvg with the site's own fonts. No service, no network.
 */
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Light theme tokens (src/styles/tokens.css): the card is shown on other
// sites, where the reader's theme is unknown.
const C = {
  bg: "#fbfaf8",
  surface: "#f6f4f0",
  border: "#e4e0d9",
  text: "#1c1917",
  muted: "#4d4741",
  accent: "#b45309",
};

const FONTS = [
  "src/assets/fonts/og/source-sans-3-400.ttf",
  "src/assets/fonts/og/source-sans-3-600.ttf",
  "src/assets/fonts/og/jetbrains-mono-400.ttf",
].map((file) => resolve(process.cwd(), file));

export interface OgCard {
  /** The statement, at display size; wrapped to at most three lines. */
  title: string;
  /** A short label above the title, set in the monospace. */
  label?: string;
  /** The address shown at the foot of the card. */
  footer: string;
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Greedy word wrap. Source Sans 3 semibold averages about 0.47em per
 * character, so `max` characters at 64px fill the 1000px text column.
 */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function ogSvg({ title, label, footer }: OgCard): string {
  const lines = wrap(title, 32);
  if (lines.length > 3) throw new Error(`OG title too long for three lines: "${title}"`);
  const size = 64;
  const leading = 74;
  // The last line of the title sits at the same height whatever its length.
  const top = 450 - (lines.length - 1) * leading;

  const mark = [
    [12, 5],
    [7.5, 11.5],
    [16.5, 11.5],
    [3, 18],
    [21, 18],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect width="100%" height="100%" fill="${C.bg}"/>
  <rect x="0" y="0" width="${OG_WIDTH}" height="8" fill="${C.accent}"/>
  <g transform="translate(100 88) scale(2)" fill="${C.accent}">${mark}</g>
  <text x="166" y="124" font-family="Source Sans 3" font-weight="600" font-size="44" letter-spacing="-0.5" fill="${C.text}">vyuha</text>
  ${label ? `<text x="100" y="${top - 84}" font-family="JetBrains Mono" font-size="22" letter-spacing="1.5" fill="${C.accent}">${escapeXml(label.toUpperCase())}</text>` : ""}
  <text font-family="Source Sans 3" font-weight="600" font-size="${size}" letter-spacing="-1.4" fill="${C.text}">${lines
    .map((l, i) => `<tspan x="100" y="${top + i * leading}">${escapeXml(l)}</tspan>`)
    .join("")}</text>
  <rect x="0" y="${OG_HEIGHT - 96}" width="${OG_WIDTH}" height="96" fill="${C.surface}"/>
  <rect x="0" y="${OG_HEIGHT - 96}" width="${OG_WIDTH}" height="1" fill="${C.border}"/>
  <text x="100" y="${OG_HEIGHT - 40}" font-family="JetBrains Mono" font-size="22" fill="${C.muted}">${escapeXml(footer)}</text>
</svg>`;
}

export function renderOgImage(card: OgCard): Uint8Array<ArrayBuffer> {
  const resvg = new Resvg(ogSvg(card), {
    fitTo: { mode: "width", value: OG_WIDTH },
    font: {
      fontFiles: FONTS,
      loadSystemFonts: false,
      defaultFontFamily: "Source Sans 3",
    },
  });
  return new Uint8Array(resvg.render().asPng());
}
