---
id: knowledge-index
title: Knowledge Graph Index
type: index
status: active
updated: 2026-05-13
tags:
  - knowledge-graph
  - index
---

# Knowledge Graph Index

This directory stores developer-facing notes for AI agents and contributors. They capture decisions, evidence, constraints, and workflows that survive context compaction or team handoff. These are **not** user-facing product docs (those live in `docs/content/`).

## Discovery

Agents discover knowledge in this order:
1. **`CLAUDE.md`** — session-critical rules and one-line callouts
2. **This index** — category table below, links to all notes
3. **Grep** — `grep -r "keyword" docs/knowledge/` for specific topics

## Index

| Category | Document | Type | Summary |
|----------|----------|------|---------|
| **Architecture** | [static-site-architecture.md](static-site-architecture.md) | decision | Fully static site, no SSR, client-side SWR, query-param routing |
| **Architecture** | [rust-wasm-performance.md](rust-wasm-performance.md) | decision | Rust/WASM benchmark: keep object transforms in TS, WASM for byte paths |
| **Architecture** | [memory-optimization.md](memory-optimization.md) | reference | Memory optimization: pooling, memoization, cache limits, monitoring |
| **Operations** | [deployment.md](deployment.md) | reference | Docker and Cloudflare Workers dual deployment guide |
| **Operations** | [worker-bundle-size.md](worker-bundle-size.md) | decision | Worker gzip 1.82 MiB (under limit); bundle breakdown; @opentelemetry/api probed = 6.5 KiB, NOT worth stubbing |
| **Operations** | [monorepo-refactor.md](monorepo-refactor.md) | operations | Bun-workspaces + Turborepo migration: status, workflow, gotchas, Phase 5 TODO |
| **Operations** | [core-memory.md](core-memory.md) | workflow | Automation core memory: code-smell scans, dead-code rules |
| **Operations** | [secret-rotation.md](secret-rotation.md) | workflow | Cloudflare Workers secret rotation: redeploy after wrangler secret put |
| **Operations** | [k8s-health-probes.md](k8s-health-probes.md) | reference | /healthz (liveness, static) vs /api/healthz (readiness, CH-gated); startupProbe; :latest stale-image incident; non-helm manifest + migration prompt |
| **Operations** | [release-automation.md](release-automation.md) | workflow | release-please + release.yml pipeline: versioning rules, PR-title guard, labeler, CHANGELOG ownership, migration prompt |
| **Specs** | [ai-insights.md](ai-insights.md) | spec | AI Insights engine: collect→enrich→persist (pluggable InsightsStore: clickhouse default / d1 / postgres / agentstate / memory), cron + manual generation, stable-key dismissal, overview panel |
| **Specs** | [mcp-server.md](mcp-server.md) | reference | MCP server at /api/mcp: tools, setup, security |
| **Security** | [sql-validator-threat-model.md](sql-validator-threat-model.md) | decision | validateSqlQuery gates all free-form SQL; whole-query (not fragment) threat model; UNION/replace()/OR-disjunction false-positive class + corpus regression guard |
| **Development** | [api-hostid-validation.md](api-hostid-validation.md) | decision | API routes must validate hostId as non-negative integer (400); `!Number.isFinite` accepted -1/1.5 → 500-retry; 9 routes fixed + cross-route source guard |
| **Specs** | [agent-conversation-storage.md](agent-conversation-storage.md) | spec | Runtime-selected agent chat persistence backends and fallback rules |
| **Specs** | [agentstate-conversation-store.md](agentstate-conversation-store.md) | spec | AgentState backend: resolveStore priority, external_id/tag isolation, append-only upsert, AI enrichment, backend/follow-ups routes |
| **Specs** | [query-config-format.md](query-config-format.md) | spec | QueryConfig type format, versioned SQL, BackgroundBar columns |
| **Specs** | [declarative-config-catalog.md](declarative-config-catalog.md) | spec | Serializable query-config catalog: CHM_CONFIG_SOURCE flag, schema→loader→catalog pipeline, rowStyle/permission/clickhouseSettings, what stays TS-only (expandable) and why |
| **Specs** | [og-images.md](og-images.md) | spec | OG/social images: Satori+resvg generator, vendored fonts, auto-regenerated on Cloudflare deploy, meta wiring |
| **Specs** | [cluster-topology.md](cluster-topology.md) | spec | Cluster topology SVG: layout pipeline, constant contracts, OKLCH gotcha, shared component, verification harness |
| **Specs** | [table-availability.md](table-availability.md) | spec | Sidebar muting (table availability), permission GRANT + version-mismatch errors, `toEmptyStateVariant` gotcha |
| **Development** | [component-ci-stability.md](component-ci-stability.md) | incident | Cypress component test fragility findings and fix direction |
| **Development** | [conventions.md](conventions.md) | workflow | Coding conventions, file organization, component patterns |
| **Tools** | [standalone-cli.md](standalone-cli.md) | reference | Rust CLI for monitoring via terminal and TUI |

## Graph Convention

Each note uses frontmatter for machine-readable edges:

- `id`: stable node id (matches filename without extension)
- `type`: `index`, `decision`, `incident`, `workflow`, `reference`, or `spec`
- `status`: `active` or `draft`
- `related`: other note ids (bidirectional links)
- `tags`: search and grouping hints

Body structure:

1. **Rule/Decision** — what to do
2. **Why** — constraint, past incident, or rationale
3. **How to apply** — when this kicks in
4. **Code references** — `file_path:line` where relevant

## Writing Rules

When adding a new note:

1. Pick the right category (architecture, operations, specs, development, tools)
2. Use the frontmatter convention above
3. Add a row to the index table above
4. Add `related` links to connected notes
5. If the rule is session-critical, add a one-line callout in `CLAUDE.md`

## Memory vs Knowledge

| Use Memory for | Use Knowledge for |
|----------------|-------------------|
| User profile & preferences | Rules and "always do X" instructions |
| Transient task state | Architecture decisions and rationale |
| Ephemeral preferences | Past incidents and post-mortems |
| Session-specific context | Conventions that every session needs |

Memory is per-Claude-instance and invisible to teammates. Knowledge docs are versioned, discoverable via grep, and indexed from `CLAUDE.md`.
