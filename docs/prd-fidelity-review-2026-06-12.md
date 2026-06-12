# PRD Fidelity & Complexity Review — 2026-06-12

> **Method**: 8-dimension fan-out review (5 completed) with adversarial verification against docs/PRD.md
> **Scope**: Full monorepo, primary focus on apps/dashboard-tsr (PRD-designated primary app)

---

## Executive Summary

The repo carries **significant complexity beyond what the PRD requires**, concentrated in one root cause: **apps/dashboard (legacy Next.js) is still fully deployed, tested, and scripted alongside its replacement apps/dashboard-tsr (TanStack Start)**. This single fact accounts for ~184K LOC of duplicated code, 31 root scripts pointing at the wrong app, a Dockerfile + Helm chart deploying the wrong app, and CI spending ~40% of its budget on the legacy build.

Separately, the **PRD itself has fidelity gaps**: its tool inventory (Appendix B) lists entirely fictional function names, route counts are internally inconsistent (88 vs 98 vs actual 85), 17 real routes are missing from the inventory, and the Dynamic Dashboards feature is marked "Not started" but is partially shipped.

**Top-line numbers:**
| Metric | Value |
|--------|-------|
| Total findings | 35 (deduped from 45 raw) |
| High-impact | 6 |
| Safe autonomous PRs identified | 6 |
| LOC deletable (dead code + dedup) | ~7,500 |
| CI jobs eliminable | 5 |

---

## P0 — Highest Leverage (Do First)

### 1. Legacy app still in full production deployment alongside TSR
- **Category**: complexity-reduction
- **Evidence**: `apps/dashboard/wrangler.toml` deploys `chmonitor-dash` to dash.chmonitor.dev. `cloudflare.yml` has a `production` job (line 438) for legacy AND a `dashboard-tsr` job (line 280) for TSR. Both build+deploy on every push to main. Route audit confirms TSR has all 78 legacy routes ported — no feature gap.
- **Impact**: Eliminates ~184K LOC of duplicated code, 5 CI jobs, 31 root script aliases, and the dual-maintenance burden.
- **Effort**: M (redirect rule + CI cleanup, not code deletion yet)
- **Action**: Stop legacy production deploy, redirect dash.chmonitor.dev → dash-tsr.chmonitor.dev.

### 2. CLAUDE.md describes the legacy Next.js app as primary — 354 lines of wrong architecture
- **Category**: doc-drift
- **Evidence**: Line 24: "This is a Next.js 15 (React 19) ClickHouse monitoring dashboard". The entire Architecture section (lines 237–591) documents App Router, SWR, `useRouter`, `next/navigation` — none apply to dashboard-tsr. AI Agents section (lines 739–829) documents a ghost `lib/agents/` path and LangGraph architecture that doesn't exist.
- **Impact**: Every contributor reads CLAUDE.md first. Wrong architecture docs = wrong contributions.
- **Effort**: S–M (rewrite two sections)

### 3. Root Dockerfile + Helm chart deploy the legacy app, not TSR
- **Category**: prd-fidelity-gap
- **Evidence**: Dockerfile line 43: `RUN bun run build --filter=dashboard`. Line 79: `CMD ["bun", "apps/dashboard/server.js"]`. `deploy/helm/` has zero references to dashboard-tsr. Docker users get the legacy app.
- **Impact**: High — deployment artifacts don't match PRD primary app.
- **Effort**: S (switch Dockerfile to apps/dashboard-tsr/Dockerfile)
- **PR candidate**: ✅ Safe, self-contained

---

## P1 — Important Complexity Reduction

### 4. Rust/WASM pipeline: zero production usage, full CI build path
- **Category**: dead-code
- **Evidence**: 5 Rust crates (1,059 LOC total). Only import is a test file in the legacy app. WASM benchmark (PR #1021) concluded all candidates below promotion threshold. Yet `ci.yml` runs a full `build-wasm` job (Rust toolchain + wasm-pack) on every PR. `Dockerfile` installs Rust unconditionally. `turbo.json` lists `rust/monitor-core/**` as globalDependency, busting cache for all workspace members.
- **Impact**: Removes CI overhead (~2 min per PR), eliminates a turbo cache-buster, simplifies Dockerfile.
- **Effort**: S
- **PR candidate**: ✅ Safe — remove build-wasm CI job, set SKIP_RUST=true, remove turbo globalDep

### 5. PRD Appendix B tool inventory is entirely fictional
- **Category**: prd-fidelity-gap
- **Evidence**: Lists 48+ function names (get_anomaly_baselines, predict_capacity, create_incident, etc.). Zero match actual code. Actual tools use different names (forecast_capacity, investigate_incident, spot_issues, etc.). PRD also gives three different category counts: 29, 30, and 32.
- **Impact**: The PRD's AI agent description is aspirational fiction, not documentation. Undermines trust in the PRD.
- **Effort**: S (grep actual tool names, rewrite appendix)

### 6. 31 root scripts alias to legacy via `--filter dashboard`; zero target dashboard-tsr
- **Category**: complexity-reduction / doc-drift
- **Evidence**: Root package.json scripts: cf:deploy, test:unit, test:coverage, start, analyze, etc. — all use `--filter dashboard`. dashboard-tsr is not even a workspace member (it has its own bun.lock). Running `bun run cf:deploy` from root deploys the legacy app.
- **Impact**: Developers running root commands interact with the wrong app.
- **Effort**: M (add dashboard-tsr to workspaces or add parallel :tsr scripts)

### 7. 80-file query-config directory duplicated across both apps (~6,500 LOC each)
- **Category**: complexity-reduction
- **Evidence**: 74 of 76 shared files are byte-for-byte identical. Neither app imports from a shared package.
- **Impact**: Dual-maintenance burden. SQL query fixes must be applied twice.
- **Effort**: M (extract to shared package) — but resolved automatically once legacy is retired.

---

## P2 — Cleanup & Fidelity

### 8. 17 real-content routes missing from PRD §5 feature inventory
- **Routes**: /about, /charts, /dashboard, /errors, /insights, /mcp, /page-views, /readonly-tables, /replicas, /table, /top-usage-columns, /top-usage-tables, /user-processes, /users, /view-refreshes, /warnings, /query-views-log
- **Category**: prd-fidelity-gap
- **Impact**: PRD under-represents what is actually shipped.

### 9. PRD §8.1 Dynamic Dashboards marked "Not started" — partially shipped
- **Evidence**: `dashboard.tsx` implements ChartPicker, SavedDashboardsToolbar, session persistence, 8 default charts. API route `api/v1/dashboard/settings.ts` handles D1-backed save/load.
- **Recommendation**: Update status to "Partially shipped".

### 10. PRD route counts internally inconsistent (88 vs 98 vs actual 85)
- **Evidence**: §1 says 88, §4 says 98, §7.5 says 98. Actual: 85 total (78 dashboard + 4 peerdb + 2 docs + 1 root).

### 11. AI agent: 651-line system prompt manually re-documents every tool
- **Category**: complexity-reduction
- **Evidence**: `clickhouse-instructions.ts` has ~350 lines of per-tool descriptions that duplicate the `dynamicTool()` `description:` fields the AI SDK already passes to the model.
- **Impact**: Drift vector — any tool change requires updating two places.
- **Recommendation**: Remove per-tool block from prompt, keep only behavioral instructions.

### 12. 3 fully orphaned root scripts (529 lines)
- **Files**: `scripts/sync-env-to-gh.ts` (257 LOC), `scripts/topo-harness.tsx` (175 LOC), `scripts/dev-monitor.sh` (97 LOC) — zero references in package.json, CI, or app code.
- **PR candidate**: ✅ Safe deletion

### 13. Dead mcp-tool-adapter.ts shim (16 lines)
- **Evidence**: Its own JSDoc says it "delegates to modular tool category files". The refactor it scaffolded is complete. Both import sites could use `createAllTools` directly.
- **PR candidate**: ✅ Safe

### 14. PeerDB integration (4 page routes + 2 API routes) absent from PRD
- **Category**: prd-fidelity-gap
- **Evidence**: Dedicated route group `(peerdb)/`, proxy API, component library — non-trivial feature with zero PRD mention.

### 15. docs/content/ai-agent/capabilities.mdx claims "~44 tools" but 63 exist
- **Category**: doc-drift
- **PR candidate**: ✅ Safe — update count and add missing categories

### 16. Docs route group embedded in dashboard-tsr not mentioned in PRD architecture
- **Evidence**: `(docs)/` route group with full markdown renderer, separate from the planned `apps/docs` Astro site.

---

## P3 — Low Priority / Deferred

- **packages/types**: 58-line micro-package with trivial type aliases — overhead exceeds benefit
- **packages/platform**: 160 lines, bypassed by dashboard-tsr via vite alias — becomes dead on legacy retirement
- **10 single-tool category files**: Could consolidate from 29 → ~20 modules
- **diagnostics-tools.ts**: 757 LOC for 3 tools with functional overlap with health-tools
- **Skill dual-storage**: SKILL.md files + generated registry.ts drift risk
- **Hardcoded model pricing table**: Will silently produce wrong estimates
- **4 redirect shims** (cluster→clusters, tables→table, zookeeper→keeper, ai-chat→agents): 80 LOC of bookmark preservation — PRD says "no backward compatibility concerns"
- **decommission-old-workers.yml**: One-shot cleanup workflow that has served its purpose

---

## PR Queue (Safe Autonomous PRs)

| # | Branch | Title | Scope | Risk |
|---|--------|-------|-------|------|
| 1 | `chore/remove-dead-scripts` | Delete 3 orphaned root scripts + decommission workflow | `scripts/sync-env-to-gh.ts`, `scripts/topo-harness.tsx`, `.github/workflows/decommission-old-workers.yml` | Low |
| 2 | `chore/ci-remove-wasm-build` | Remove WASM build CI job + turbo rust globalDep | `.github/workflows/ci.yml` (remove build-wasm job), `turbo.json` (remove rust/monitor-core globalDep) | Low |
| 3 | `fix/dockerfile-switch-to-tsr` | Switch root Dockerfile to dashboard-tsr | `Dockerfile` (replace content with apps/dashboard-tsr/Dockerfile logic), `docker-compose.yml` | Low |
| 4 | `docs/fix-claudemd-architecture` | Fix CLAUDE.md doc drift: architecture + AI agents + script paths | `CLAUDE.md` — rewrite Project Overview, annotate Architecture as legacy, replace AI Agents LangGraph section, fix script path references | Low (docs only) |
| 5 | `chore/agent-remove-dead-shim` | Remove dead mcp-tool-adapter shim + update capabilities doc | `apps/dashboard-tsr/src/lib/ai/agent/mcp-tool-adapter.ts` (delete), update imports in `clickhouse-agent.ts` and `index.ts`, update `docs/content/ai-agent/capabilities.mdx` tool count | Low |
| 6 | `docs/prd-fix-route-inventory` | Fix PRD route counts and add missing routes | `docs/PRD.md` — settle route count to 85, add 17 missing routes to §5, fix /cluster redirect, update §8.1 status | Low (docs only) |
