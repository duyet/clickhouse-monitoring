---
id: og-images
type: spec
related: [deployment, conventions]
tags: [seo, og, social, satori, static]
---

# Open Graph (OG) Images

Social-share preview images (1200×630) for the three public-facing apps.

## How it works

The pipeline is **Satori** (HTML/CSS object tree → SVG) + **@resvg/resvg-js**
(SVG → PNG), both root `devDependencies`. Generation is **hermetic**: Inter
TTFs are vendored under `assets/og-fonts/`, so no network access is needed.

- Generator: [`scripts/generate-og-images.ts`](../../scripts/generate-og-images.ts)
- Run: `bun run og:generate`

The PNGs are **regenerated automatically on every Cloudflare deploy** and also
committed to each app's `public/` dir:

- **CI deploy** (`.github/workflows/cloudflare.yml`) — each of the `dashboard`,
  `landing`, and `docs` jobs runs a "Generate OG images" step (root install +
  `bun run og:generate`) before the app build, so the deployed image always
  matches the current template. The step runs at repo root because the
  generator's deps live in the root workspace, not in the standalone apps.
- **Committed PNGs** — serve as the baseline for local dev and the build-check
  workflows (`landing.yml` / `docs.yml`), which don't run the generator. Keep
  them in sync by running `bun run og:generate` and committing after template
  changes.

## Outputs

| File | Used by |
|------|---------|
| `apps/landing/public/og.png` | Landing (`chmonitor.dev`) |
| `apps/docs/public/og.png` | Docs (`docs.chmonitor.dev`) |
| `apps/dashboard/public/og.png` | Dashboard default |
| `apps/dashboard/public/og-overview.png` | `/overview` |
| `apps/dashboard/public/og-clusters.png` | `/clusters` |
| `apps/dashboard/public/og-explorer.png` | `/explorer` |
| `apps/dashboard/public/og-agents.png` | `/agents` |

## Meta wiring

- **Landing** — `apps/landing/src/layouts/Base.astro` (`image` prop, default
  `/og.png`; absolute URL via `Astro.site`).
- **Docs** — `apps/docs/src/layouts/MainLayout.astro`.
- **Dashboard** — base tags in `src/routes/__root.tsx`; per-page `og:image` /
  `twitter:image` overrides in each route's `head()` (overview, clusters,
  explorer, agents).

All use `twitter:card = summary_large_image` so the full banner renders.

## Editing / adding a card

Edit the `CARDS` array in `scripts/generate-og-images.ts`, re-run
`bun run og:generate`, then commit the regenerated PNG(s). Brand palette
(amber `#f59e0b` → orange `#f97316` on zinc `#09090b`) mirrors the landing
`Base.astro` `:root` tokens.
