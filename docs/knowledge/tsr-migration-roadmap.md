---
id: tsr-migration-roadmap
type: operations
related: [static-site-architecture, deployment, conventions]
tags: [tanstack-start, migration, roadmap, dashboard-tsr]
---

# TanStack Start Migration — Roadmap to 100%

> **MIGRATION COMPLETE** (PR #1392 cutover, 2026-06-14). All phases below are done.
> `apps/dashboard` was renamed to `apps/dashboard`; the legacy Next.js app was
> deleted. `dash.chmonitor.dev` is now served by the TanStack Start worker
> (`chmonitor-dash`). This doc is kept as historical record — do not re-execute.

Executable plan for completing the Next.js → TanStack Start migration. The app
now lives at `apps/dashboard` (was `apps/dashboard` during the migration). Epic: #1392.

## Architecture (already proven & merged — do NOT re-litigate)

- **Isolated own-lockfile app**: `apps/dashboard` has its own `bun.lock` and
  is **NOT** a root workspace (mirrors `apps/landing`/`apps/docs`). Keeps the
  Vite 8 toolchain out of the Next/MCP root lockfile.
- **Dual-target, one source** (`vite.config.ts` branches on `BUILD_TARGET`):
  - default/`cloudflare` → `@cloudflare/vite-plugin` → `wrangler deploy`
  - `node` → `nitro({preset:'node-server'})` → `.output/server/index.mjs` (Docker)
  - `cloudflare:workers` aliased to `src/lib/cloudflare-workers-shim.ts`
    (`env = process.env`) on the node target.
- **Static prerender** (`tanstackStart({ prerender:{enabled,crawlLinks}, spa:{enabled} })`):
  per-route static HTML served via Workers Assets / Docker static; dynamic data
  loads client-side. This is the required "fast like SSR" model — keep it.
- **Data layer = TanStack Query** (NOT SWR). Hooks in `src/lib/query/*`; fetch
  helpers in `src/lib/swr/*` (legacy dir name).
- **`@chm/*` from source**: Vite `resolve.alias` + `dedupe` + `ssr.noExternal` +
  tsconfig `paths` → `../../packages/<name>/src`. Heavy `@chm/clickhouse-client`
  works on workerd via `getClient({ web:true })` (mandatory) + node-client stub.
- **Clerk** gated via `isClerkClientEnabled()` (`src/lib/clerk/clerk-client.ts`).
- **query-config/registry foundation** merged: `src/lib/query-config/{types,index}`,
  `src/lib/api/{chart-registry,table-registry,query-executor,server-env}`.
- **UI primitives** merged: 16 shadcn primitives in `src/components/ui/`,
  `src/components/skeletons`, `EmptyState`, shimmer skeleton + `animate-shimmer`.

## The assembly recipe (proven 10×; repeat for every chunk)

1. `git -C <repo> fetch origin main` (origin ref staleness causes bugs), then
   `git worktree add /private/tmp/chm-tsr-<x> -b tsr/<x> origin/main`.
2. `cd .../apps/dashboard && bun install` (restore isolated node_modules);
   `bun add <leaf deps>` as needed. For UI: `bunx shadcn@latest add <prims> --yes`.
3. Port files. If sourcing from a workflow's structured output, `html.unescape`
   the contents (they're entity-escaped). Mechanical ports → Sonnet agents.
4. `NODE_OPTIONS=--max-old-space-size=4096 bun run build` (vite build + tsc +
   prerender). Fix until green. (Node target: `bun run build:node`.)
5. biome from the MAIN checkout: `./node_modules/.bin/biome check --write
   /private/tmp/chm-tsr-<x>/apps/dashboard/src` (worktree has no root
   node_modules). Re-build to confirm.
6. Commit (`Co-Authored-By: duyetbot <bot@duyet.net>`), push, `gh pr create`,
   `gh pr merge --squash` (merges immediately — required-checks gate is minimal).
7. `git worktree remove --force`; `pkill -f 'vite|bun.*build'`.

**Quality gate:** every PR must `bun run build` (vite+tsc+prerender) green AND
biome-clean before merge. Never merge a non-building chunk.

## Phases to 100% (dependency-ordered)

### Phase 1 — Component foundation (the critical path) [partly done]
UI primitives ✅. Remaining:
- **data-table system** (`apps/dashboard/components/data-table/*` → port). The
  biggest dependency: column defs, cells/formatters (`cells/*`), sorting-fns,
  pagination, text-wrap, the `DataTable` component (built on `@tanstack/react-table`,
  already a dep). ~30+ files. Port the core `DataTable` + the common cell
  formatters first; defer exotic cells.
- **chart base**: `components/charts/chart-card*`, the chart wrapper that wires
  `useChartData` → recharts; `ChartError` (thin version first — full one couples
  to `card-error-utils` + markdown).
- Shared: `error-alert`, `card-toolbar`, `related-charts`.
- Strategy: 1 workflow, fan out cell formatters (Sonnet) + DataTable core (default).

### Phase 2 — Charts (86) [depends P1 + chart-registry data]
Each chart = a component using `useChartData({ name, hostId })` + recharts.
- Data side: port the registry-backed API route `charts/[name]` → server route
  that resolves from `chart-registry` + runs `query-executor`.
- Fan out wide: workflow with one Sonnet agent per ~5 charts (dynamic fan-out).
- Register each chart in `chart-registry`.

### Phase 3 — API routes (49 remaining) [registry now unblocked]
- Registry-backed: `charts/[name]`, `tables/[name]`, `data`, `explorer/*`,
  `cluster-counts/[key]`, `menu-counts/[key]`, `overview` — use query-executor.
- Independent simple ones still left: `config`, `clean`, `init`, `table-availability`,
  `timezone`✅, `host-status`✅, `notifications`✅, `health`✅, `pageview`,
  `cluster-topology`, `findings`, `peerdb-status`, `tables`.
- Deferred (need subsystems): `agent*`, `agents/*`, `mcp` (Phase 5),
  `conversations*` (D1), `auth/api-key`.
- Use the shared `src/lib/api/clickhouse-config.ts` helper (don't re-duplicate).
- Fan out per-route (Sonnet). `getClient({web:true})` always.

### Phase 4 — Pages (83) [depends P1–P3]
Port by route group: `(dashboard)` (overview tabs, tables, clusters,
running-queries, explorer, etc.), `(docs)`, `(peerdb)`. Each page = a route file
(`src/routes/(group)/<page>.tsx`) using ported components + `useHostId` + Query
hooks. `next/navigation`→`@tanstack/react-router`, `next/link`→router `Link`,
`next/image`→`img`, `next/dynamic`→`React.lazy`. Add each to prerender crawl.
Fan out by route group (Sonnet); follow TanStack `migrate-from-next-js`.

### Phase 5 — Subsystems
- **MCP route** #1398: add `@chm/mcp-server` aliased (like other @chm), port
  `app/api/mcp/route.ts` → server route calling shared `handleMcp()`. Also
  unblocks Clerk `verify.ts` (server token check).
- **middleware** #1397: `middleware.ts` (API-key auth, Clerk gating, cloud→dash
  301) → TanStack Start request middleware / per-route guards.
- **AI agent**: `/api/v1/agent` streaming (`createUIMessageStream*` — Web
  standard, low risk) + the assistant-ui client + conversations (D1) provider.
- **Clerk consumers**: `nav-user`, `agent-auth-gate`, etc. — each lazy-requires
  its Clerk piece behind `isClerkClientEnabled()`.

### Phase 6 — CI rewire #1403
Wire `apps/dashboard` into `.github/workflows/`: build (CF + node), tsc,
biome, prerender, Cypress (re-target), smoke. Add a Docker build job for the
node target. Capture the Win Metrics (build time, bundle, TTFB, LCP) vs the Next
baseline for the before/after scorecard on #1392.

### Phase 7 — Cutover #1405 (the only irreversible step)
Deploy `chmonitor-dash-tsr`. Parity-diff vs the live Next worker (API JSON + DOM
across the route set). Canary re-point `dash.chmonitor.dev` → `chmonitor-dash-tsr`,
24h bake with auto-rollback armed (re-point to old `chmonitor-dash` on any failed
gate), then decommission old + rename. **This is automated but verification must
be adversarial** (a parity diff can't prove intent, only sameness).

## Gotchas (don't relearn — cost real iterations)

- **Workflow agents WRITE to the shared main checkout** despite "structured
  output only" → contamination + stale `git pull` ("Aborting"). Always assemble
  in worktrees from `origin/main`; after workflows `git reset --hard origin/main
  && git clean -fd apps/dashboard`. Add "READ-ONLY, no file writes" to prompts.
- **`@clickhouse/client-web` `.json<Row>()` WRAPS**: JSON→`{data:Row[]}`,
  JSONEachRow→`Row[]`. Pass the ROW type as the generic, not the wrapper.
- **`getClient({ web:true })` MANDATORY** on workerd: `nodejs_compat` defines
  `process`, so the package's runtime auto-detect false-negatives and picks the
  node client (node:net/tls) → breaks.
- **`ssr.external` is REJECTED** by `@cloudflare/vite-plugin`; keep the node
  `@clickhouse/client` out via the empty-stub alias (`src/lib/empty.ts`).
- **tsconfig `types:[]` is exclusive** → must include `"node"`. Drop deprecated
  `baseUrl`. Router factory export MUST be `getRouter`. No `verbatimModuleSyntax`.
- **Isolated app resolution**: `resolve.dedupe` (vite) + leaf-dep `paths`→
  `./node_modules` (tsc) so source-pkg deps resolve. `client-web` types via its
  exports map → point the path at `dist/index.d.ts`.
- **`node` here is an nvm wrapper** that errors non-interactively → test the node
  bundle via `bun .output/server/index.mjs`.
- Cost: mechanical fan-out on `model:'sonnet'`, judgment on default. Run
  non-overlapping workflows in parallel for speed.

## Verified versions (pin these)
react-start 1.168.19 · react-router 1.170.11 · vite 8.0.16 ·
@cloudflare/vite-plugin 1.39.2 · wrangler 4.97 · nitro@3(beta) ·
@tanstack/react-query 5.101 · next-themes 0.4.6 · lucide-react 1.17 ·
class-variance-authority · @clerk/tanstack-react-start.

## Done = 100% ✅

All 83 pages + 86 charts + data-table render with live data; all ~56 API routes
ported; middleware/MCP/agent working; CI builds + deploys the single
`apps/dashboard` (TanStack Start) target; `dash.chmonitor.dev` served by
`chmonitor-dash` after the cutover bake; legacy Next.js app deleted; Win-Metrics
scorecard posted on #1392.
