# Changelog

All notable changes to the vyuha site are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the site's versions are tags on `main`.

## Unreleased

### Pages

- Changelog page (`/changelog/`): the releases in this file, newest first, linked from the header and the footer. An `## Unreleased` section like this one is not shown; a heading that is neither a release (`## <version> - <YYYY-MM-DD>`) nor `Unreleased` fails the build.

## 0.1.0 - 2026-11-11

The first release of https://vyuhalabs.github.io/vyuha-site-r2.

### Pages

- Home page: what vyuha is and who it is for, the three things a visitor should take away (work, evidence, control), each shown with a drawing of the product (the Inbox, a run with its evidence, a project's playbook and the decision matrix), and the next step.
- Model page (`/model/`): work, agents, decisions, evidence, playbooks, pods and budgets, one section each, in plain words.
- Getting-started guide (`/guide/`): access is by request, then the first steps: connect a repository, create a project, file a first issue and read a run's evidence.
- FAQ (`/faq/`): eight questions, including who merges the code.
- 404 page that links home.
- Header navigation between the pages, with the current page marked.
- Per page: title, description, canonical link, Open Graph and Twitter cards, a generated Open Graph image, and an entry in `sitemap.xml`. `robots.txt` points at the sitemap.

### Design and build

- Astro static output, TypeScript strict, pnpm, Node 22, Biome.
- One accent (deep saffron) on warm greys, light and dark both following `prefers-color-scheme`; Source Sans 3 and JetBrains Mono, self-hosted and subset; a contrast table in `docs/contrast.md`.
- No client-side JavaScript, no cookies, no third-party requests.
- Content collections for the model and guide sections and for the FAQ, validated by `astro check`.
- `.github/ISSUE_TEMPLATE/access-request.md`: the form a request for access is opened from.

### Workflows

- `build`: install, `astro check`, `astro build`, the internal link check over `dist/` and the audit of the built site.
- `quality`: `biome ci`, `tsc --noEmit` and the unit tests.
- `deploy`: builds and publishes to GitHub Pages, from `main` only.
