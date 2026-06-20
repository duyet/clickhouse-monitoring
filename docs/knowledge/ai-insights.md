---
id: ai-insights
title: AI Insights Engine
type: spec
status: active
updated: 2026-06-17
tags:
  - insights
  - findings
  - overview
  - ai
  - dismissal
related:
  - mcp-server
  - query-config-format
  - conventions
---

# AI Insights Engine

AI-suggested insights surfaced on the overview page (`/overview`). Insights are
short, actionable observations about a cluster — "error rate climbing", "table X
is fragmented", "replication is lagging" — generated and **cached server-side**,
**dismissible per-user**, and refreshable on demand.

## Pipeline

`collect → enrich (optional LLM) → persist → read → render`

| Stage | Module |
|-------|--------|
| Collect (deterministic) | `src/lib/insights/collectors.ts` |
| Enrich (optional LLM) | `src/lib/insights/llm-enrich.ts` |
| Orchestrate + persist | `src/lib/insights/generate-insights.ts` |
| Read + de-dupe | `src/lib/insights/read-insights.ts` |
| Types + stable key | `src/lib/insights/types.ts` |

- **Collectors** run read-only ClickHouse queries (anomaly recent-vs-baseline,
  storage fragmentation/compression, readonly replicas, replication lag),
  porting the SQL/severity heuristics from the agent's `anomaly-tools.ts` /
  `insights-tools.ts`. They **never throw** — any failure yields `[]` so the
  feature degrades on read-only clusters or missing system tables.
- **Enrichment is optional.** When a provider key resolves
  (`isProviderConfigured(resolveProvider(DEFAULT_MODEL).providerId)`), candidates
  pass through one `generateObject` call that tightens wording. With no key (or
  on any error) candidates are returned unchanged — the "if available" half.
- **Persistence reuses the findings store** (`src/lib/findings/findings-store.ts`,
  `FINDINGS_TABLE`, 30-day TTL). Insights are recorded with `source: 'ai-insight'`.

## Generation triggers

- **Cron**: `runHealthSweep()` (`src/lib/health/server-sweep.ts`) calls
  `generateInsights(hostId)` per host on the existing 5-minute Cloudflare trigger
  (`api/cron/health-sweep`). No new trigger.
- **Manual**: `POST /api/v1/insights/generate?host=<id>` (the panel's Refresh
  button), optionally carrying the user's config (see below).

## Configuration (per-user)

Insight generation is configurable per-user, persisted client-side (localStorage,
like dismissals + the agent model picker). All overrides are **optional and
validated server-side** — omitting them reproduces the original behavior.

- **Settings model** — `src/lib/insights/settings.ts` (`InsightsSettings`:
  `model` | `promptStyle` | `enrich` | `window`), pure/isomorphic with
  `sanitizeInsightsSettings` + `generateParamsFromSettings`. Hook:
  `src/lib/query/use-insights-settings.ts` (localStorage + `CustomEvent`/`storage`
  broadcast so the panel, settings page, and header popover stay in sync).
- **Prompt styles** — `src/lib/insights/prompts.ts`: `concise` (default) /
  `detailed` / `beginner`, each a distinct enrichment system prompt. The
  deterministic baseline copy is unchanged.
- **Model override** — validated server-side in
  `src/lib/insights/resolve-model.ts` against the *configured* registry
  (`getModelRegistry()` + `isProviderConfigured`); an unknown/unconfigured id
  falls back to the deployment default (`DEFAULT_MODEL`).
- **Generate API params** — `POST /api/v1/insights/generate` accepts
  `enrich` (`false` skips LLM), `model` (`provider:model`), `promptStyle`. The
  read endpoint (`GET /api/v1/insights`) takes `since` = the chosen window.
- `enrichInsights(candidates, { model, promptStyle })` /
  `generateInsights(hostId, { enrich, model, promptStyle })` thread the overrides.

## Settings page

- `/insights-settings` (`src/routes/(dashboard)/insights-settings.tsx`) renders
  `InsightsSettingsForm` (`src/components/insights/insights-settings-form.tsx`):
  enrichment toggle, model picker (configured providers from
  `/api/v1/agents/models`), prompt style, lookback window, reset-to-defaults.
- Reachable from the overview panel's settings gear and the header popover.

## Read + dismissal

- `GET /api/v1/insights?host=<id>` reads `ai-insight` findings, **de-duplicates by
  stable key** (newest wins) and bounds to a recent window (`6 HOUR` default) so
  resolved issues age out.
- **Stable key** = `host:category:metric:title` (`insightKey()`). Dismissals key
  off this so re-generation does not resurrect a dismissed card.
- **Dismissal is per-user in localStorage** (`dismissed-ai-insights`), mirroring
  `lib/notifications/dismissed-notifications.ts`. See
  `src/lib/insights/dismissed-insights.ts` and the `useInsights` hook
  (`src/lib/query/use-insights.ts`).

## UI

- `src/components/insights/insights-panel.tsx` — overview hero (status strip →
  KPIs → **insights** → tabs). Renders a slim "Generate insights" CTA when empty.
- `src/components/insights/insight-card.tsx` — shadcn `Card` wrapper (never edits
  `components/ui/`), severity-toned accent, dismiss `X`, and a derived action
  link (e.g. View tables / Open running queries / Ask the agent).
- `src/components/insights/insights-popover.tsx` — **global header popover**
  (mirrors `NotificationsPopover`), mounted in `header-actions.tsx` so insights
  surface on every page: severity-toned count badge, top insights with deep
  links, Refresh, and footer links to the overview panel + settings page. Reuses
  `useInsights`, so counts/dismissals stay in sync with the panel.

## Gotchas

- The findings table stores only scalars — the card **action is re-derived** from
  `metric`/`category` on read (`deriveAction` in `read-insights.ts`), so rich
  per-table prompts only appear in the immediate `generate()` response.
- Health-sweep findings are **not** written to the findings table (only webhook
  dispatch), so reading `source='ai-insight'` returns exactly engine output.
- Tests: `src/lib/insights/insights.test.ts` (pure key + dismissal logic; shims
  `window`/`localStorage`). Run with `bun test src/lib/insights`.
