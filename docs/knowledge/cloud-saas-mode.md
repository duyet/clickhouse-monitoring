---
id: cloud-saas-mode
title: Cloud (SaaS) mode — one codebase, two products
type: spec
status: active
updated: 2026-06-29
tags:
  - saas
  - cloud
  - auth
  - hosts
  - onboarding
related:
  - deployment
  - agentstate-conversation-store
  - conventions
---

# Cloud (SaaS) mode

`dash.chmonitor.dev` is the hosted product; Docker / Kubernetes / a self-built
Cloudflare Worker are the self-hosted (OSS) product. **Same codebase** — the only
difference is runtime configuration, gated by the **cloud-mode** flag.

## The invariant

FAIL-CLOSED to self-hosted. Unset/junk `CHM_CLOUD_MODE` (runtime) or
`VITE_CLOUD_MODE` (build) → NOT cloud → OSS behaviour unchanged. Cloud is purely
additive; it never removes a monitoring feature. Mirrors `lib/edition`'s
fail-open design (edition already lists `cloud` as an enterprise feature).

## Behaviour matrix

| | Self-hosted (default) | Cloud (`CHM_CLOUD_MODE=true`) |
|---|---|---|
| Env `CLICKHOUSE_HOST` | operator's real hosts, full access | public **read-only demo** (`source:'demo'`) |
| Anonymous | sees env hosts | sees the demo (explore, no account) |
| Signed-in | sees env hosts | demo hidden → own D1 connections only; zero → welcome/setup |
| Auth | usually `none` | Clerk + `CHM_CLERK_PUBLIC_READ=true` |
| Per-user conns | optional | on (`VITE_FEATURE_USER_CONNECTIONS_DB=true`) |

Read-only on the demo is *enforced* by the existing public-read gate: anonymous
principals can only read, and signed-in users never see the demo. The `readOnly`
flag on `MergedHostInfo` is the UI cue.

**Public-demo allowlist.** A deploy may bind more env hosts than it wants to
show publicly. `CHM_CLOUD_DEMO_HOSTS` (comma list of `CLICKHOUSE_NAME` entries)
narrows the demo to a named subset — e.g. `CHM_CLOUD_DEMO_HOSTS=duet-ubuntu`
exposes only that host to anonymous visitors; any other bound host stays
private. Cloud-mode only; unset = all env hosts are the demo. Filter is
fail-open: a zero-match allowlist (typo) passes through ALL hosts rather than
black out the demo (empty host list = 503). The host `id` (index into
`CLICKHOUSE_HOST`) is preserved so `?host=<id>` routing keeps resolving.
Implemented in `lib/cloud/demo-hosts.ts` (`filterToDemoHosts`), applied at
`api/v1/hosts.ts` (the shown list) and `lib/api/clickhouse-config.ts`
(`getClickHouseConfigsFromEnv` → live status / health / notifications).

## Files

- `apps/dashboard/src/lib/cloud/cloud-mode.ts` — resolvers + `parseCloudMode`. Tested.
- `vite.config.ts` `loadDeployEnv` + CLIENT_ENV + `src/vite-env.d.ts` — client `VITE_CLOUD_MODE` DERIVES from canonical `CHM_CLOUD_MODE` (set once).
- `apps/dashboard/.env.production` (+ `.env.preview` overlay) — **single source of truth** for the hosted product's non-secret config (`CHM_CLOUD_MODE=true`, `CHM_FEATURE_USER_CONNECTIONS_DB=true`, auth, LLM). `wrangler.toml` declares NO `[vars]`.
- `scripts/patch-wrangler-env.ts` — reads `.env.production`/`.env.preview`, injects the non-`VITE_` keys as Worker runtime `[vars]` at deploy.
- `.github/workflows/cloudflare.yml` build step — `build:preview` (PRs) / `build:production` (main) set `CHM_BUILD_ENV`; values come from the `.env*` files, none hardcoded.
- `lib/swr/use-merged-hosts.ts` — demo tagging, hide-when-signed-in; exposes `cloudMode` / `isSignedIn`.
- `components/host/host-switcher.tsx` — Demo / read-only badges; `demo` behaves like `env` for live status (server-backed by index).
- `components/host/first-run-empty-state.tsx` — redesigned welcome/setup (cloud signed-in / cloud anon / self-hosted).

## Connection-error help

`lib/connection-errors.ts` → `classifyConnectionError(raw)` maps a raw "Test
connection" error string to a kind (`host_not_allowed`, `invalid_url`,
`auth_failed`, `access_denied`, `dns_error`, `connection_refused`, `tls_error`,
`timeout`, `mixed_content`, `unknown`) with title + explanation + fix + docs
slug. `extractConnectionErrorMessage(body)` handles both response shapes
(`{error:string}` from the test route, `{error:{message}}` from the shared
validation builder). Rendered by `ConnectionErrorPanel` in `connection-form.tsx`.
Docs: `docs/content/guide/guides/connection-errors.mdx` (slug
`guides/connection-errors`). Tested in `lib/connection-errors.test.ts`.

## Billing (Polar) — cloud SaaS only

M3 wires paid plans via [Polar](https://polar.sh). Cloud-only; OSS/self-host is
free forever (auth `none` ⇒ unlimited, plans inert).

- **Plans**: `lib/billing/plans.ts` (`BILLING_PLANS`) is the price/capability
  source of truth; `apps/landing/Pricing.astro` mirrors the numbers.
- **Config**: `lib/billing/polar-config.ts` — `getPolarClient()` (server
  `sandbox|production` from `CHM_POLAR_SERVER`) + product↔plan mapping from
  `CHM_POLAR_PRODUCT_<PLAN>_<PERIOD>` env vars. Product ids live in env (sandbox
  vs production differ), NOT in `plans.ts`. `POLAR_ACCESS_TOKEN` is a secret.
- **Storage**: one row per user in `user_subscriptions` (migration
  `0003_user_subscriptions.sql`) in the shared `CHM_CLOUD_D1` database.
  `subscription-store.ts` (D1 CRUD; degrades to null without D1),
  `user-subscription.ts` `getUserPlan()` (defaults free; downgrades when status
  not live or the period ended — no cron needed).
- **Routes**: `api/v1/billing/checkout` (hosted checkout, `externalCustomerId =
  Clerk userId` ⇒ no customer map), `…/portal`, `…/subscription` (GET),
  `api/v1/webhooks/polar` (verifies via `validateEvent` over the RAW body).
- **Enforcement**: `api/v1/user-connections` POST returns 402 at `plan.hosts`
  (null = unlimited).
- **UI**: `routes/(dashboard)/billing.tsx`, gated to cloud mode in
  `app-sidebar.tsx`; `feature: 'billing'`.
- **Setup**: `apps/dashboard/scripts/polar-setup.ts` creates Pro/Max
  monthly+yearly products from `BILLING_PLANS` and prints the
  `CHM_POLAR_PRODUCT_*` env lines. Sandbox/production tokens are distinct — a
  production token 401s against `sandbox-api.polar.sh`.

## Gotchas

- `apps/dashboard` is NOT a root bun workspace — run `bun install` *inside*
  `apps/dashboard`, not just at the monorepo root.
- The dashboard `build` script calls `vite` directly; run via `bun run build`
  from inside `apps/dashboard` (its local `.bin`), not from the repo root.
- Build needs `VITE_CLOUD_MODE`/`VITE_FEATURE_USER_CONNECTIONS_DB` inlined to
  exercise cloud behaviour locally — they are build-time, not runtime, on the
  client.
