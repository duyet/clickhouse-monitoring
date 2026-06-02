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
self-hosted `/docs` route also reads from there). A `prebuild` sync script
copies and adapts those MDX files into `src/content/docs/` for Starlight.

## Deploy

Served as static assets by a Cloudflare Worker (`wrangler.toml`) on
`docs.chmonitor.dev`.
