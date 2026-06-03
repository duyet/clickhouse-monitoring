# chmonitor docs (`apps/docs`)

Documentation site for **docs.chmonitor.dev**, built with
[Astro Starlight](https://starlight.astro.build) (static output). Deployed to
Cloudflare Workers as `chmonitor-docs`.

## Standalone install (important)

Like `apps/landing`, this app is **intentionally NOT a member of the root bun
workspace** (the root `package.json` `workspaces` list only names
`apps/dashboard` and `apps/mcp`). The reason: Astro requires `zod@^3`, but the
root workspace pins `zod@^4` via a load-bearing `overrides` entry that the
dashboard and AI agent depend on. Bun applies root `overrides` to every
workspace member with no way to scope an exception, which would force `zod@4`
onto Astro and break its config validation.

Keeping `apps/docs` out of the workspace gives it an isolated install where
Astro resolves its native `zod@3`. It has its own `bun.lock`.

## Develop

```bash
cd apps/docs
bun install
bun run dev      # http://localhost:4321
bun run build    # -> dist/
```

Or from the repo root: `bun run build:docs`.

## Content

The full documentation content lives in `docs/content/**` (the dashboard's
self-hosted `/docs` route also reads from there). The `scripts/sync-docs.mjs`
prebuild step copies and adapts those MDX files into `src/content/docs/` for
Starlight (this generated directory is gitignored).

> Edit docs under `docs/content/**`, **not** `src/content/docs/**` — the latter
> is regenerated on every build and overwritten.

## Theme & customization

Configured in [`astro.config.mjs`](./astro.config.mjs):

- **Logo & favicon** — `src/assets/logo.svg` (copied from the dashboard's brand
  mark), surfaced in the header and as `public/favicon.svg`.
- **Sidebar** — hand-curated groups (Getting Started, Deployment, Advanced,
  Reference, …) with external links back to **chmonitor.dev** (home) and
  **dash.chmonitor.dev** (live dashboard). The previous `autogenerate: '.'`
  tree was replaced because root `index` + `*.mdx` overview pages collided with
  their same-named directories.
- **Styling** — `src/styles/custom.css` applies a shadcn / Vercel-docs
  aesthetic: the [Geist](https://vercel.com/font) + Geist Mono typefaces
  (self-hosted via `@fontsource-variable/*`), a monochrome zinc palette, and
  crisp 1px borders. Only Starlight CSS custom properties are overridden, so the
  theme survives Starlight upgrades.

## Deploy

Served as static assets by a Cloudflare Worker (`wrangler.toml`) on
`docs.chmonitor.dev`.
