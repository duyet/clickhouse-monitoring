---
id: observability-sentry
type: spec
related: [cloud-saas-mode, deployment, static-site-architecture]
tags: [observability, sentry, errors, cloudflare, oss]
updated: 2026-06-30
---

# Sentry error tracking (OSS + Cloud)

Frontend **and** server error tracking for `apps/dashboard`, wired so the same
codebase works for self-hosted (OSS) and the hosted Cloud product. **Disabled
unless a DSN is configured** — the OSS default sends nothing anywhere.

## Why two SDKs

The dashboard ships to **Cloudflare Workers (workerd)**, not Node. `@sentry/node`
(OpenTelemetry, `async_hooks`) cannot run there, so:

- **Browser** → `@sentry/react`, initialized in `router.tsx` behind a
  `typeof document` guard + dynamic `import()` so it never enters the
  size-constrained Worker SSR bundle (#1393).
- **Server (Worker / Node)** → `@sentry/cloudflare`. Workers have no long-lived
  `init()`; a client is bound **per request** via `wrapRequestHandler`, added as
  the **outermost** middleware in `start.ts`. It captures thrown errors and
  re-throws them, so existing handling is unchanged.

## Configuration (one canonical name)

| Var | Where | Purpose |
|-----|-------|---------|
| `CHM_SENTRY_DSN` | `.env.production` (committed, public) / `.env.local` (OSS) | DSN. Empty → Sentry off. Inlined as client `VITE_SENTRY_DSN`; injected as a Worker `[var]` for the server. |
| `CHM_SENTRY_ENVIRONMENT` | env files | `production` / `preview` / `self-hosted`. |
| `CHM_SENTRY_TRACES_SAMPLE_RATE` | env files | `0..1`, default `0.1`. |
| `SENTRY_AUTH_TOKEN` | **GitHub secret** only | Build-time source-map upload. Never committed. |
| `SENTRY_ORG` / `SENTRY_PROJECT` | build env | Default `duyet` / `chm-cloud` in `vite.config.ts`. |

The DSN is a **public** client value (it ships in the browser bundle), so
committing it to `.env.production` is intentional and consistent with the rest of
that file. OSS `.env.example` leaves it blank → off by default.

## Deploy wiring

- `vite.config.ts` derives `VITE_SENTRY_*` from `CHM_SENTRY_*` and adds the
  `sentryVitePlugin` **only when `SENTRY_AUTH_TOKEN` is present** (so OSS / PR /
  dependabot builds without the token never fail). Source maps are emitted
  `hidden`, uploaded, then deleted from the output.
- `patch-wrangler-env.ts` injects every non-`VITE_` key (incl. `CHM_SENTRY_DSN`)
  as a Worker `[var]` — no change needed there.
- `.github/workflows/cloudflare.yml` build step passes `SENTRY_AUTH_TOKEN`.
- `scripts/sync-env-to-gh.ts` lists `SENTRY_AUTH_TOKEN` for `gh secret set`.

## Files

- `src/lib/observability/sentry-options.ts` — pure shared options builder (tested).
- `src/lib/observability/sentry.client.ts` — browser init + `captureClientException`.
- `src/lib/observability/sentry.server.ts` — resolves Worker/Node options.
- `start.ts` — `sentryMiddleware` (outermost) via `wrapRequestHandler`.
- `router.tsx` — early client init. `layout-error-boundary.tsx` — boundary capture.
