# vyuha-site-r2

The public website of vyuha, at https://vyuhalabs.github.io/vyuha-site-r2. Astro, static output, no client-side JavaScript.

- **Set up:** Node 22 (`nvm use`), then `pnpm install --frozen-lockfile`.
- **Run:** `pnpm dev`, then open http://localhost:4321/vyuha-site-r2/.
- **Build:** `pnpm build` writes `dist/` for the address in `SITE_URL` (default above).
- **Check:** `pnpm check`, `pnpm check:links`, `pnpm audit:dist` (after a build), `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- **Deploy:** merge to `main`; the `deploy` workflow builds and publishes to GitHub Pages. Nothing deploys from a branch.
- **Pull requests:** the `build` and `quality` workflows must pass.
- **Design tokens:** `src/styles/tokens.css`; after changing a colour, run `pnpm contrast` (writes `docs/contrast.md`).
- **Fonts and notes:** `docs/`.
