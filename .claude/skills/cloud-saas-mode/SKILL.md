---
name: cloud-saas-mode
description: >-
  Work on chmonitor's Cloud (SaaS) vs self-hosted (OSS) behaviour from ONE
  codebase. Use when changing how dash.chmonitor.dev differs from Docker/K8s/OSS
  builds: the cloud-mode flag, public read-only demo hosts, the welcome/setup
  onboarding page, per-user (D1) ClickHouse connections, host visibility for
  anonymous vs signed-in users, or the "Test connection" error classifier and
  its docs links. Triggers: "cloud mode", "SaaS", "demo host", "welcome page",
  "setup page", "first-run", "add host error", "connection error", "read-only
  host", "hide hosts when signed in".
metadata:
  tags: saas, cloud, oss, self-hosted, onboarding, hosts, clerk, connection-errors
---

# chmonitor Cloud (SaaS) mode

One codebase, two products. `dash.chmonitor.dev` = Cloud; Docker/K8s/self-built
Worker = self-hosted (OSS). The difference is runtime config behind one flag.

> This is a project skill kept under `.claude/skills/` (NOT `.agents/skills/`,
> which the `build:skills` registry scans for end-user AI-agent skills). Keep dev
> skills here so they never leak into the agent bundle.

## Golden rule

**Fail-closed to self-hosted.** Unset/junk `CHM_CLOUD_MODE` / `VITE_CLOUD_MODE`
→ NOT cloud → OSS unchanged. Cloud behaviour is ADDITIVE only. Never gate a core
monitoring feature behind cloud mode. (Mirrors `lib/edition` fail-open design.)

## The flag

- Resolver: `apps/dashboard/src/lib/cloud/cloud-mode.ts`
  - `isCloudModeClient()` — build-time, React/hooks (reads `VITE_CLOUD_MODE`).
  - `isCloudModeServer(env)` — runtime `CHM_CLOUD_MODE` wins over build-time.
  - `parseCloudMode(v)` — only `'true'|'1'|'cloud'` (trim/case-insensitive) → true.
- Build inline: `vite.config.ts` CLIENT_ENV + `src/vite-env.d.ts`. Each client
  `VITE_*` DERIVES from the canonical `CHM_*` (set the value once).
- Single source of truth: `apps/dashboard/.env.cloud` (+ `.env.preview` overlay).
  It feeds BOTH the vite client build (`CHM_BUILD_ENV=cloud|preview` →
  `build:cloud`/`build:preview`) AND the Worker runtime `[vars]`
  (`scripts/patch-wrangler-env.ts` injects the non-`VITE_` keys).
  `wrangler.toml` declares NO `[vars]` — never re-add one; edit `.env.cloud`.
- Self-hosted uses the same names from `apps/dashboard/.env.example` (Docker
  `env_file`, Helm `values.yaml`). Secrets only via `set-secrets.ts` / K8s Secret.

## Behaviour

| | Self-hosted | Cloud |
|---|---|---|
| Env hosts | real, full access | `source:'demo'`, read-only |
| Anonymous | env hosts | the demo |
| Signed-in | env hosts | demo HIDDEN → own D1 connections; zero → welcome/setup |

Implemented in `lib/swr/use-merged-hosts.ts` (tag demo, hide-when-signed-in;
returns `cloudMode`/`isSignedIn`). Switcher badges + `demo`-as-`env` status in
`components/host/host-switcher.tsx`.

## Welcome / setup page

`components/host/first-run-empty-state.tsx` renders 3 variants by
`(cloudMode, isSignedIn)`: cloud signed-in (Connect-your-host + Add-host dialog),
cloud anon (sign-in + value prop), self-hosted (env-var guidance + browser add).
Gate `ClerkSignInButton` behind `isClerkEnabled()`.

## Connection-error help

`lib/connection-errors.ts`:
- `classifyConnectionError(raw)` → `{kind,title,explanation,fix,docsSlug,raw}`.
  Kinds: host_not_allowed, invalid_url, auth_failed, access_denied, dns_error,
  connection_refused, tls_error, timeout, mixed_content, unknown. Add new
  patterns by extending `RULES` (first match wins, specific first).
- `extractConnectionErrorMessage(body)` handles `{error:string}` (test route)
  AND `{error:{message}}` (shared validation builder).
- Rendered by `ConnectionErrorPanel` in `connection-form.tsx`.
- Docs page slug: `guides/connection-errors`
  (`docs/content/guide/guides/connection-errors.mdx`).

## Build/test gotchas

- `apps/dashboard` is NOT a root bun workspace → `cd apps/dashboard && bun install`.
- Build inside `apps/dashboard`: `bun run build` (vite + tsc --noEmit).
- Tests: `bun test src/lib/cloud src/lib/connection-errors.test.ts`.
- Full reference: `docs/knowledge/cloud-saas-mode.md`.

## Keep this skill current

When you change cloud-mode behaviour, demo-host visibility, the welcome/setup
page, per-user connections, or the connection-error classifier, UPDATE this file
and `docs/knowledge/cloud-saas-mode.md` in the same change. See the
"Auto-improve project skills" note in the root `CLAUDE.md`.
