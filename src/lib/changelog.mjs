// @ts-check
/**
 * Reads the releases out of CHANGELOG.md, which follows Keep a Changelog:
 * one `## <version> - <YYYY-MM-DD>` heading per release, newest first, its
 * notes up to the next `##` heading. The square brackets of Keep a
 * Changelog's linked form (`## [0.2.0] - 2026-12-01`) are accepted too.
 *
 * An `## Unreleased` section is not a release and is left out. Any other
 * `##` heading that is not a version and a date is an error, so a typo in
 * CHANGELOG.md fails the build instead of dropping a release from the page.
 */

/** @typedef {{ version: string, date: string, body: string }} Release */

const UNRELEASED = /^\[?unreleased\]?$/i;
const RELEASE = /^\[?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]?\s+-\s+(\d{4}-\d{2}-\d{2})$/;

/**
 * @param {string} markdown the text of CHANGELOG.md
 * @returns {Release[]} the releases, in the file's order (newest first)
 */
export function parseChangelog(markdown) {
  /** @type {Release[]} */
  const releases = [];
  /** @type {{ heading: string, line: number, lines: string[] } | undefined} */
  let section;
  let inFence = false;

  const close = () => {
    if (!section) return;
    const heading = section.heading;
    if (UNRELEASED.test(heading)) return;
    const match = RELEASE.exec(heading);
    if (!match) {
      throw new Error(
        `CHANGELOG.md:${section.line}: "## ${heading}" is not "## <version> - <YYYY-MM-DD>" or "## Unreleased"`,
      );
    }
    const [, version = "", date = ""] = match;
    const parsed = new Date(`${date}T00:00:00Z`);
    // A round trip catches dates that parse but do not exist, such as 2026-02-30.
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new Error(`CHANGELOG.md:${section.line}: ${date} is not a date`);
    }
    if (releases.some((r) => r.version === version)) {
      throw new Error(`CHANGELOG.md:${section.line}: ${version} is listed twice`);
    }
    releases.push({ version, date, body: section.lines.join("\n").trim() });
  };

  markdown.split(/\r?\n/).forEach((text, i) => {
    if (/^(```|~~~)/.test(text)) inFence = !inFence;
    const heading = inFence ? null : /^##\s+(.+?)\s*#*\s*$/.exec(text);
    if (heading) {
      close();
      section = { heading: heading[1] ?? "", line: i + 1, lines: [] };
    } else if (section) {
      section.lines.push(text);
    }
  });
  close();

  for (let i = 1; i < releases.length; i++) {
    const newer = releases[i - 1];
    const older = releases[i];
    if (newer && older && newer.date < older.date) {
      throw new Error(
        `CHANGELOG.md: ${older.version} (${older.date}) is listed after ${newer.version} (${newer.date}); newest first`,
      );
    }
  }
  return releases;
}
