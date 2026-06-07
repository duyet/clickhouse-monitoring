---
id: env-v0.3-migration
title: v0.3 Environment Variable Migration Guide
type: reference
status: active
updated: 2026-06-07
tags:
  - env
  - migration
  - config
  - deployment
  - wrangler
related:
  - deployment
  - conventions
  - agent-conversation-storage
---

# v0.3 Environment Variable Migration Guide

## 1. Overview

v0.3 simplifies the environment variable system from ~60 vars to ~20 for standard deploys. The main change is a single `CHM_FEATURES` config string that replaces four separate feature-flag mechanisms (`CHM_DISABLED_FEATURES`, `CHM_AUTH_REQUIRED_FEATURES`, `CHM_FEATURE_<ID>_ACCESS`, `CHM_FEATURE_<ID>_ENABLED`).

Other changes:
- Prefixed LLM, health, and conversation vars with `CHM_` for namespace consistency.
- Eliminated vars that derived their value from other sources (e.g. `HEALTH_ALERT_ENABLED` is now implicit from the webhook URL).
- PeerDB cache tuning vars (`PEERDB_CACHE_TTL_MS`, `PEERDB_CACHE_MAX_ENTRIES`, `PEERDB_FETCH_TIMEOUT_MS`) are hardcoded at sensible defaults (10s TTL, 500 entries, 10s timeout) and no longer configurable.
- Build-time client vars use `VITE_CHM_*` in the TanStack Start app (with `VITE_*` and `NEXT_PUBLIC_*` legacy fallback).

**Full backward compatibility**: old names still work as fallback. You can migrate incrementally -- nothing breaks if you leave old names in place.

**Code references**:
- Feature string parser: `packages/platform/src/feature-permissions/features-config.ts`
- Legacy compat layer: `packages/platform/src/feature-permissions/features-config.ts:159` (`parseLegacyFeatureOverrides`)
- Env reader with fallback: `packages/platform/src/env.ts` (`readEnvWithFallback`)
- Health alert compat: `apps/dashboard-tsr/src/lib/health/server-alert-config.ts`
- LLM key/model compat: `apps/dashboard-tsr/src/lib/ai/providers.ts`

---

## 2. Old to New Mapping

### Feature Flags

| Old Name | New Name | Notes |
|---|---|---|
| `CHM_DISABLED_FEATURES` | `CHM_FEATURES` | Convert each entry to `<id>:off` |
| `CHM_AUTH_REQUIRED_FEATURES` | `CHM_FEATURES` | Convert each entry to `<id>:auth` |
| `CHM_FEATURE_AGENT_ACCESS` | `CHM_FEATURES` | `agent:auth` |
| `CHM_FEATURE_<ID>_ACCESS` | `CHM_FEATURES` | `<id>:auth` or `<id>:public` |
| `CHM_FEATURE_<ID>_ENABLED` | `CHM_FEATURES` | `<id>:on` or `<id>:off` |

Valid feature IDs: `overview`, `agent`, `insights`, `health`, `queries`, `tables`, `metrics`, `dashboard`, `security`, `logs`, `settings`, `cluster`, `operations`, `actions`, `mcp`, `peerdb`, `docs`, `about`.

### LLM / AI Agent

| Old Name | New Name | Notes |
|---|---|---|
| `LLM_API_KEY` | `CHM_LLM_API_KEY` | Legacy works as fallback |
| `LLM_API_BASE` | `CHM_LLM_API_BASE` | Legacy works as fallback |
| `LLM_MODEL` | `CHM_LLM_MODEL` | Legacy works as fallback |
| `LLM_EXTRA_MODELS` | `CHM_LLM_EXTRA_MODELS` | Legacy works as fallback |

### Health Alerting

| Old Name | New Name | Notes |
|---|---|---|
| `HEALTH_ALERT_ENABLED` | (eliminated) | Derived automatically: enabled when `CHM_HEALTH_WEBHOOK_URL` is set |
| `HEALTH_ALERT_WEBHOOK_URL` | `CHM_HEALTH_WEBHOOK_URL` | Legacy works as fallback |
| `HEALTH_ALERT_MIN_SEVERITY` | `CHM_HEALTH_MIN_SEVERITY` | Legacy works as fallback |

### Conversation Store

| Old Name | New Name | Notes |
|---|---|---|
| `AGENT_CONVERSATION_STORE` | `CHM_CONVERSATION_STORE` | Legacy works as fallback |
| `AGENT_CONVERSATION_PERSISTENCE` | (eliminated) | Derived from store selection: set any persistent store and persistence is on |

### PeerDB

| Old Name | New Name | Notes |
|---|---|---|
| `PEERDB_CACHE_TTL_MS` | (eliminated) | Hardcoded 10000ms (10s) |
| `PEERDB_CACHE_MAX_ENTRIES` | (eliminated) | Hardcoded 500 |
| `PEERDB_FETCH_TIMEOUT_MS` | (eliminated) | Hardcoded 10000ms (10s) |

### Build-Time Client Vars (TanStack Start / Vite)

| Old Name | New Name | Notes |
|---|---|---|
| `VITE_AUTH_PROVIDER` | `VITE_CHM_AUTH_PROVIDER` | Legacy + `NEXT_PUBLIC_AUTH_PROVIDER` fallback |
| `VITE_CLERK_PUBLISHABLE_KEY` | `VITE_CHM_CLERK_PUBLISHABLE_KEY` | Legacy + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` fallback |
| `VITE_FEATURE_CONVERSATION_DB` | (eliminated) | Replaced by runtime `CHM_CONVERSATION_STORE` |

### Build-Time Client Vars (Next.js)

| Old Name | New Name | Notes |
|---|---|---|
| `NEXT_PUBLIC_AUTH_PROVIDER` | `NEXT_PUBLIC_CHM_AUTH_PROVIDER` | Legacy fallback |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `NEXT_PUBLIC_CHM_CLERK_PUBLISHABLE_KEY` | Legacy fallback |

### Unchanged (no migration needed)

These vars keep their names:
- `CLICKHOUSE_HOST`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_NAME`, `CLICKHOUSE_MAX_EXECUTION_TIME`, `CLICKHOUSE_TZ`
- `CHM_AUTH_PROVIDER`, `CHM_API_KEY_SECRET`
- `CRON_SECRET`
- `CLERK_SECRET_KEY`
- `OPENROUTER_*`, `NVIDIA_*`, `ANYROUTER_*`, `AGENT_*` (behaviour vars like `AGENT_API_TOKEN`, `AGENT_ENABLE_CONTROL_TOOLS`)
- `PEERDB_API_URL`, `PEERDB_PASSWORD`
- `DATABASE_URL`, `POSTGRES_URL`, `CONVERSATIONS_D1_DATABASE_ID`
- `CLOUDFLARE_WORKERS`, `DEBUG`

---

## 3. CHM_FEATURES Format Reference

A single comma-separated string. Each entry is `feature_id:value`.

```
CHM_FEATURES=agent:auth,peerdb:off
```

### Value aliases

| Alias | Expands to |
|---|---|
| `auth` | `access=authenticated` |
| `public` | `access=public` |
| `off` | `enabled=false` |
| `on` | `enabled=true` |

### Explicit form

Use `key=value` when you need full control:

```
CHM_FEATURES=agent:access=authenticated,peerdb:enabled=false
```

### Examples

```bash
# Agent requires sign-in
CHM_FEATURES=agent:auth

# Agent gated, PeerDB hidden
CHM_FEATURES=agent:auth,peerdb:off

# Multiple features disabled
CHM_FEATURES=metrics:off,settings:off,about:off

# Mix of access and enabled
CHM_FEATURES=agent:auth,mcp:auth,peerdb:off,settings:auth

# Explicit key=value form
CHM_FEATURES=agent:access=authenticated,settings:enabled=false
```

### Merging with legacy vars

`CHM_FEATURES` is parsed first. Legacy vars (`CHM_DISABLED_FEATURES`, `CHM_AUTH_REQUIRED_FEATURES`, `CHM_FEATURE_<ID>_*`) overlay on top. This means you can migrate one feature at a time without touching the rest.

---

## 4. Before/After wrangler.toml Examples

### Before (v0.2-style)

```toml
[vars]
CLICKHOUSE_HOST = "https://clickhouse.example.com:8443"
CLICKHOUSE_USER = "monitoring"
CLICKHOUSE_NAME = "prod"
CLICKHOUSE_MAX_EXECUTION_TIME = "60"
CLOUDFLARE_WORKERS = "1"
CHM_AUTH_PROVIDER = "clerk"
LLM_MODEL = "openrouter:openrouter/free"
OPENROUTER_REFERER = "https://clickhouse.example.com"
OPENROUTER_APP_NAME = "chmonitor"
# Old feature flags
CHM_FEATURE_AGENT_ACCESS = "authenticated"
CHM_FEATURE_PEERDB_ENABLED = "false"
# Old health alerting
HEALTH_ALERT_WEBHOOK_URL = "https://hooks.slack.com/services/T00/B00/xxx"
HEALTH_ALERT_MIN_SEVERITY = "warning"
```

### After (v0.3)

```toml
[vars]
CLICKHOUSE_HOST = "https://clickhouse.example.com:8443"
CLICKHOUSE_USER = "monitoring"
CLICKHOUSE_NAME = "prod"
CLICKHOUSE_MAX_EXECUTION_TIME = "60"
CLOUDFLARE_WORKERS = "1"
CHM_AUTH_PROVIDER = "clerk"
CHM_LLM_MODEL = "openrouter:openrouter/free"
OPENROUTER_REFERER = "https://clickhouse.example.com"
OPENROUTER_APP_NAME = "chmonitor"
# Single feature string replaces all CHM_FEATURE_* vars
CHM_FEATURES = "agent:auth,peerdb:off"
# Health alerting -- no HEALTH_ALERT_ENABLED needed; webhook presence = enabled
CHM_HEALTH_WEBHOOK_URL = "https://hooks.slack.com/services/T00/B00/xxx"
CHM_HEALTH_MIN_SEVERITY = "warning"
```

---

## 5. AI Agent Migration Prompt

Copy and paste this prompt to your AI assistant (Claude, Codex, Cursor, etc.) to automate the migration.

---

```
You are migrating a ClickHouse Monitor deployment to the v0.3 environment
variable format. The project is a Next.js/TanStack Start app deployed on
Cloudflare Workers (wrangler.toml config).

## Your task

1. Scan these files for legacy env var usage:
   - wrangler.toml (production and preview [env] blocks)
   - .env, .env.local, .env.production, .env.prod, .env.example
   - .github/workflows/*.yml (CI build env vars)
   - docker-compose.yml (if present)
   - Any scripts that set env vars (scripts/*.ts)

2. Identify all legacy env vars from the mapping table below.

3. For each legacy var found:
   a. If it has a direct new name, rename it (keep the old name as a comment
      for one release cycle if you want safety).
   b. If it is a CHM_FEATURE_<ID>_ACCESS or CHM_FEATURE_<ID>_ENABLED var,
      convert it into the CHM_FEATURES string format.
   c. If it is eliminated (HEALTH_ALERT_ENABLED, PEERDB_CACHE_*,
      AGENT_CONVERSATION_PERSISTENCE, VITE_FEATURE_CONVERSATION_DB), remove it.

4. For build-time vars (VITE_*/NEXT_PUBLIC_*), update CI workflow env
   and vite.config.ts / next.config.ts CLIENT_ENV mappings.

5. Do NOT change vars that are not in the mapping table (CLICKHOUSE_*,
   CHM_AUTH_PROVIDER, CLERK_SECRET_KEY, etc.).

## Mapping table

### Feature flags → CHM_FEATURES

Old vars to find and consolidate into a single CHM_FEATURES string:

| Old Name | CHM_FEATURES entry |
|---|---|
| CHM_DISABLED_FEATURES=overview,metrics | overview:off,metrics:off |
| CHM_AUTH_REQUIRED_FEATURES=agent,settings | agent:auth,settings:auth |
| CHM_FEATURE_AGENT_ACCESS=authenticated | agent:auth |
| CHM_FEATURE_PEERDB_ENABLED=false | peerdb:off |
| CHM_FEATURE_SETTINGS_ACCESS=authenticated | settings:auth |
| CHM_FEATURE_<ID>_ACCESS=authenticated | <id>:auth |
| CHM_FEATURE_<ID>_ENABLED=false | <id>:off |

Format: CHM_FEATURES=entry1,entry2,entry3
Aliases: auth=access=authenticated, public=access=public, off=enabled=false, on=enabled=true

### Renamed vars (old → new, old still works as fallback)

| Old | New |
|---|---|
| LLM_API_KEY | CHM_LLM_API_KEY |
| LLM_API_BASE | CHM_LLM_API_BASE |
| LLM_MODEL | CHM_LLM_MODEL |
| LLM_EXTRA_MODELS | CHM_LLM_EXTRA_MODELS |
| HEALTH_ALERT_WEBHOOK_URL | CHM_HEALTH_WEBHOOK_URL |
| HEALTH_ALERT_MIN_SEVERITY | CHM_HEALTH_MIN_SEVERITY |
| AGENT_CONVERSATION_STORE | CHM_CONVERSATION_STORE |
| VITE_AUTH_PROVIDER | VITE_CHM_AUTH_PROVIDER |
| VITE_CLERK_PUBLISHABLE_KEY | VITE_CHM_CLERK_PUBLISHABLE_KEY |
| NEXT_PUBLIC_AUTH_PROVIDER | NEXT_PUBLIC_CHM_AUTH_PROVIDER |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | NEXT_PUBLIC_CHM_CLERK_PUBLISHABLE_KEY |

### Eliminated vars (remove)

| Var | Why |
|---|---|
| HEALTH_ALERT_ENABLED | Now derived from CHM_HEALTH_WEBHOOK_URL presence |
| AGENT_CONVERSATION_PERSISTENCE | Now derived from CHM_CONVERSATION_STORE selection |
| PEERDB_CACHE_TTL_MS | Hardcoded 10000ms |
| PEERDB_CACHE_MAX_ENTRIES | Hardcoded 500 |
| PEERDB_FETCH_TIMEOUT_MS | Hardcoded 10000ms |
| VITE_FEATURE_CONVERSATION_DB | Replaced by runtime CHM_CONVERSATION_STORE |

## Questions to ask me before starting

Ask these questions and wait for my answers before making changes:

1. "What auth mode are you using? (clerk / none / proxy)"
2. "Which features should require authentication? (list feature IDs, or 'none')"
3. "Which features should be hidden entirely? (list feature IDs, or 'none')"
4. "Which LLM provider are you using? (openrouter / nvidia / anyrouter / custom)"
5. "Do you use health alerting (Slack/Discord webhooks)? If yes, what is the webhook URL and minimum severity?"
6. "Do you use PeerDB monitoring? Is it enabled or disabled?"
7. "Do you use server-side agent conversation storage? If yes, which backend? (d1 / clickhouse / postgres / agentstate / durable-object)"
8. "Should I keep legacy var names as comments for a transition period, or do a clean switch?"

## Output

Produce a diff (or edited files) for each file that needs changes. Group
changes by file. Add a summary of what changed and why at the top.
```
