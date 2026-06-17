---
name: version-upgrade-advisor
description: "Advises whether and how to upgrade ClickHouse — versioning scheme, upgrade path, what you gain, pre/post-upgrade checklist."
---

# Version Upgrade Advisor

> **Accuracy note**: This skill covers method, not memorized changelogs. For exact per-version details — new functions, removed settings, default-value changes — always consult the official ClickHouse release notes at clickhouse.com/docs/whats-new/changelog. Never assert specific changelog facts without directing the user to verify them.

## Detect Current Version and Uptime

```sql
SELECT version(), uptime();
```

The `get_metrics` tool also returns the server version in its output — check there first before running a query.

Key things to capture before advising:
- Current version string (e.g. `24.3.5.46`)
- Uptime (a long uptime on an old version is a signal the operator avoids upgrades — note this)
- Whether this is a cluster: `SELECT * FROM system.clusters` — mixed versions across replicas matter

## How ClickHouse Versioning Works

Format: `YY.M.patch.build` — e.g. `24.3.5.46` = year 2024, month 3, patch 5.

**Release types**:
- **Regular releases** — monthly, supported until the next regular release (~1 month). Good for tracking latest features; require frequent upgrades.
- **LTS releases** — designated every ~6 months (historically `.3` and `.8` months); receive backported fixes for ~1 year. The repo's schema matrix (see `docs/clickhouse-schemas/index.md`) covers: `23.3`, `23.8`, `24.3`, `24.8` as LTS anchors.

**Support window**: LTS releases get security/critical backports for roughly 1 year after release. Regular releases get fixes only until the next release. Running a version past its support window means no patches — upgrade recommended.

**Guidance**: prefer upgrading to the latest LTS if stability matters; track regular releases only if you need cutting-edge features and can upgrade frequently.

## General Upgrade Guidance

1. **One significant line at a time** — do not skip multiple major version lines (e.g. `23.3` → `24.3` → `25.3`, not `23.3` → `25.3` in one hop). Review the backward-incompatible changes for each intermediate LTS.
2. **Read the changelog first** — ClickHouse marks breaking changes explicitly. Settings that change defaults or are removed are the most common surprises.
3. **Test on staging with production data volumes** — especially joins, aggregations with large state, and any experimental features you use.
4. **Back up before upgrading** — at minimum export table schemas; ideally snapshot data or use replicas as rollback points.
5. **Rolling upgrade for replicated clusters** — upgrade one replica at a time. ClickHouse supports mixed-version replication within the same minor line; check the release notes for the specific hop you are making. Never run permanently mixed-version clusters.
6. **Upgrade ClickHouse Keeper / ZooKeeper in sync** — if using Keeper, check compatibility requirements for the version pair.

## What You Typically Gain by Upgrading

These are broad, stable themes — exact improvements vary by version; verify against release notes.

- **Query optimizer improvements** — planner rewrites, better join ordering, improved predicate pushdown, new join algorithms (e.g. `grace_hash`)
- **New functions and data types** — aggregate combinators, JSON support expansions, new numeric/date types, string functions
- **Better compression and storage** — codec improvements, lighter part metadata, faster merges
- **JOIN performance** — hash join improvements, parallel hash, better memory management for large joins
- **Observability** — new columns in `system.query_log`, `system.processes`, `system.errors`; better structured logging
- **Security** — new auth mechanisms, role/row-level security improvements
- **Async inserts and ingest throughput** — deduplication improvements, async insert reliability

Do not cite specific performance numbers or function names without directing the user to verify in the changelog.

## Pre-Upgrade Checklist

Before upgrading, audit the following:

```sql
-- 1. Check settings that differ from defaults (non-default = potential conflict)
SELECT name, value, default, changed
FROM system.settings
WHERE changed = 1
ORDER BY name;

-- 2. Check for deprecated settings in use
SELECT name, value
FROM system.settings
WHERE name IN (
  -- populate from the target version's deprecation list; do not hard-code here
);

-- 3. List experimental features in use
SELECT name, value
FROM system.settings
WHERE name LIKE '%experimental%' AND value != '0';

-- 4. Check current errors before upgrade (baseline)
SELECT name, value, last_error_message
FROM system.errors
WHERE value > 0
ORDER BY value DESC
LIMIT 20;

-- 5. Verify replication is healthy (replicated clusters only)
SELECT database, table, replica_name, is_leader,
       log_max_index - log_pointer AS lag
FROM system.replicas
WHERE log_max_index - log_pointer > 0
   OR future_parts > 0;
```

Also check:
- Any `ON CLUSTER` DDL in flight — let it finish
- Active long-running queries — drain or wait
- Disk space — new versions sometimes need extra space during part rewrite on first startup
- Whether your client library versions support the new server protocol (especially if upgrading a major line)

## Verify After Upgrade

```sql
-- Confirm version
SELECT version();

-- Check for new errors since upgrade
SELECT name, value, last_error_message, last_error_time
FROM system.errors
WHERE value > 0
  AND last_error_time > now() - INTERVAL 1 HOUR
ORDER BY value DESC;

-- Confirm replication caught up (clusters)
SELECT database, table, replica_name,
       log_max_index - log_pointer AS lag,
       last_queue_update
FROM system.replicas
ORDER BY lag DESC;

-- Spot-check query performance on known slow queries
-- (run your typical workload; compare system.query_log duration_ms)
SELECT query_id, query, duration_ms
FROM system.query_log
WHERE type = 'QueryFinish'
  AND event_time > now() - INTERVAL 30 MINUTE
ORDER BY duration_ms DESC
LIMIT 20;
```

Smoke test: run a representative SELECT from each critical table, confirm row counts, verify merges are progressing, check `system.merges` and `system.mutations` have no stalled entries.

## Related Skills

- `migration-patterns` — schema migrations and DDL patterns that may be needed alongside an upgrade
- `clickhouse-best-practices` — production settings to review after upgrading (defaults may have changed)
- `hardware-tuning` — if upgrading unlocks new compression or parallelism settings, revisit resource tuning
