---
title: "Agent capabilities"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/ai-agent/capabilities.mdx"
---

The agent exposes a small set of **powerful primitives** (18 tools, plus 3
env-gated control tools). Anything without a dedicated tool is done by writing SQL
with the `query` tool, guided by a **skill** recipe. You never call tools
directly — the agent picks and chains them automatically.

## Tools

| Category | What it covers | Tools |
|---|---|---|
| Schema & exploration | Databases, tables, columns, ad-hoc SQL | `query`, `list_databases`, `list_tables`, `get_table_schema`, `explore_table_schema` |
| Query analysis | Running, slow, failed queries; EXPLAIN | `get_running_queries`, `get_slow_queries`, `get_failed_queries`, `explain_query` |
| Health, storage, replication, merges | Metrics, disks, parts, replication, merges | `get_metrics`, `get_disk_usage`, `get_table_parts`, `get_replication_status`, `get_merge_status` |
| Plan & verify | A visible, adaptive step-by-step plan | `update_plan` |
| Knowledge & interaction | Load expert guides; ask the user | `load_skill`, `ask_user` |
| Charts & visualization | Run SQL and return an interactive chart | `query_and_visualize` |
| Control actions (env-gated) | Kill query/mutation, optimize table | `kill_query`, `kill_mutation`, `optimize_table` |

Everything else (expensive-query rankings, query patterns, anomalies, table-design
advice, capacity forecasts, settings, logs, replication queue, ZooKeeper, users…) is
done with `query` plus the relevant skill recipe — so the agent keeps full reach
with a much smaller, more reliable tool surface.

Control tools (`kill_query`, `kill_mutation`, `optimize_table`) are disabled unless
`AGENT_ENABLE_CONTROL_TOOLS=true`. The agent always confirms before using them.

## Skills

Skills are expert guides — with copy-pasteable SQL recipes against `system.*` — that
the agent loads on demand. Because the toolset is lean, **skills are how the agent
stays powerful**. Eighteen skills are included:

| Skill | Covers |
|---|---|
| `system-tables-reference` | Exact columns of key system tables; recipes; tools vs raw SQL |
| `data-analysis` | Aggregation & time-series recipes (largest scan, expensive queries, patterns, period comparison) |
| `anomaly-detection` | Recent-vs-baseline comparisons (error spikes, p95 regressions, part explosions) |
| `query-tuning-advisor` | Diagnose a slow query and propose concrete rewrites & better joins |
| `query-optimization` | PREWHERE, JOIN patterns, materialized views, EXPLAIN, indexes |
| `schema-design-advisor` | ORDER BY/partition keys, codecs, skip indexes, column type right-sizing |
| `storage-optimization` | Compression codecs, TTL, tiered storage, part management |
| `version-upgrade-advisor` | Whether/how to upgrade ClickHouse and what is gained |
| `hardware-tuning` | Size settings to the box's cores/RAM/disk |
| `concept-explainer` | Teach core ClickHouse concepts |
| `replication-guide` | ReplicatedMergeTree, failover, lag diagnosis, Keeper |
| `cluster-operations` | Distributed tables, resharding, node management, topology |
| `migration-patterns` | ALTER patterns, zero-downtime schema changes |
| `security-hardening` | RBAC, row policies, quotas, audit logging |
| `clickhouse-best-practices` | Schema design, query tuning, operational guidelines |
| `troubleshooting` | OOM, slow merges, stuck mutations, error-code diagnosis |
| `incident-response` | Structured triage recipes (disk full, errors, replication lag, health sweep) |
| `plan-and-verify` | Decompose with `update_plan` and verify each result before concluding |

List available skills: `GET /api/v1/agent/skills`.

## Plan and verify

For multi-step tasks the agent authors a live checklist with `update_plan`, keeps
exactly one step in progress, and adapts the plan as results come in. Crucially, it
**verifies each result before stating it** — re-querying or cross-checking a second
system table for a finding, running `explain_query` on both versions before claiming
a rewrite is faster, and separating what is verified from what is a hypothesis. The
`plan-and-verify` and `incident-response` skills encode the recipes. Simple one-step
questions skip the plan entirely.

## Example questions

Ask in plain English:

- **"Which queries are running right now and how long have they been executing?"**
  — lists query id, user, elapsed time, and memory, sorted by duration.

- **"What were the 10 slowest queries in the last 24 hours?"**
  — fetches from the query log and offers to EXPLAIN any of them.

- **"What's the largest data scan ever performed on this cluster?"**
  — loads `data-analysis` and runs the `system.query_log` recipe.

- **"Anything abnormal in the last hour versus baseline?"**
  — loads `anomaly-detection` and compares recent activity to the preceding window.

- **"Show me query volume per hour over the last day as a chart."**
  — runs the aggregation and renders a line chart inline.

- **"Suggest a better ORDER BY and which columns should be LowCardinality for `analytics.events`."**
  — loads `schema-design-advisor`, inspects the schema and parts, and recommends changes.
