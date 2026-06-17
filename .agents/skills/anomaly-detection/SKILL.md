---
name: anomaly-detection
description: "Detect cluster abnormalities by comparing recent activity (last 1h) to a baseline (preceding 24h) using the raw query tool."
---

# Anomaly Detection

Use this skill when no dedicated tool covers anomaly detection. All recipes below
use the `query` tool with raw SQL. Compare a **recent window** (last 1 hour) to a
**baseline window** (preceding 24 hours) and surface ratios or deltas that exceed
the thresholds in the interpretation section.

Column availability varies by ClickHouse version — load `system-tables-reference`
before modifying any query.

---

## Error-Rate Spike

**Source**: `system.query_log` (per-query granularity) + `system.errors` (server-wide counters).

```sql
-- Ratio of failed queries: recent vs baseline
-- recent  = last 1 hour, baseline = prior 24 hours
SELECT
    countIf(type = 'ExceptionWhileProcessing' AND event_time >= now() - INTERVAL 1 HOUR)  AS recent_failures,
    countIf(type != 'QueryStart'              AND event_time >= now() - INTERVAL 1 HOUR)  AS recent_total,
    countIf(type = 'ExceptionWhileProcessing' AND event_time  < now() - INTERVAL 1 HOUR
                                              AND event_time >= now() - INTERVAL 25 HOUR) AS baseline_failures,
    countIf(type != 'QueryStart'              AND event_time  < now() - INTERVAL 1 HOUR
                                              AND event_time >= now() - INTERVAL 25 HOUR) AS baseline_total,
    round(recent_failures  / nullIf(recent_total,   0) * 100, 2) AS recent_error_pct,
    round(baseline_failures / nullIf(baseline_total, 0) * 100, 2) AS baseline_error_pct
FROM system.query_log
WHERE is_initial_query = 1
```

```sql
-- Top error codes in the recent window
SELECT exception_code, count() AS n, any(exception) AS sample
FROM system.query_log
WHERE type = 'ExceptionWhileProcessing'
  AND is_initial_query = 1
  AND event_time >= now() - INTERVAL 1 HOUR
GROUP BY exception_code
ORDER BY n DESC
LIMIT 20
```

```sql
-- system.errors: codes whose value jumped since last hour
-- (no time column — compare last_error_time as a proxy)
SELECT name, code, value, last_error_time, last_error_message
FROM system.errors
WHERE last_error_time >= now() - INTERVAL 1 HOUR
ORDER BY value DESC
LIMIT 20
```

---

## Query Duration Regression

**Source**: `system.query_log`.

```sql
-- p95 duration: recent 1h vs baseline 24h
SELECT
    quantileIf(0.95)(query_duration_ms,
        event_time >= now() - INTERVAL 1 HOUR)  AS p95_recent_ms,
    quantileIf(0.95)(query_duration_ms,
        event_time  < now() - INTERVAL 1 HOUR
        AND event_time >= now() - INTERVAL 25 HOUR) AS p95_baseline_ms,
    round(p95_recent_ms / nullIf(p95_baseline_ms, 0), 2) AS ratio
FROM system.query_log
WHERE type = 'QueryFinish'
  AND is_initial_query = 1
  AND event_time >= now() - INTERVAL 25 HOUR
```

```sql
-- Break down by user to find who regressed
SELECT
    user,
    quantileIf(0.95)(query_duration_ms,
        event_time >= now() - INTERVAL 1 HOUR)  AS p95_recent_ms,
    quantileIf(0.95)(query_duration_ms,
        event_time  < now() - INTERVAL 1 HOUR
        AND event_time >= now() - INTERVAL 25 HOUR) AS p95_baseline_ms,
    round(p95_recent_ms / nullIf(p95_baseline_ms, 0), 2) AS ratio
FROM system.query_log
WHERE type = 'QueryFinish'
  AND is_initial_query = 1
  AND event_time >= now() - INTERVAL 25 HOUR
GROUP BY user
ORDER BY ratio DESC
LIMIT 20
```

---

## Query Volume Spike / Drop

**Source**: `system.query_log`.

```sql
-- Queries per minute: recent 1h vs baseline hourly average
SELECT
    countIf(event_time >= now() - INTERVAL 1 HOUR) AS recent_count,
    countIf(event_time  < now() - INTERVAL 1 HOUR
        AND event_time >= now() - INTERVAL 25 HOUR) / 24 AS baseline_hourly_avg,
    round(recent_count / nullIf(baseline_hourly_avg, 0), 2) AS ratio
FROM system.query_log
WHERE type != 'QueryStart'
  AND is_initial_query = 1
  AND event_time >= now() - INTERVAL 25 HOUR
```

```sql
-- Per-minute breakdown of the last 2 hours (spot sudden spikes or drops)
SELECT
    toStartOfMinute(event_time) AS minute,
    count() AS queries
FROM system.query_log
WHERE type != 'QueryStart'
  AND is_initial_query = 1
  AND event_time >= now() - INTERVAL 2 HOUR
GROUP BY minute
ORDER BY minute
```

---

## Memory Anomalies

**Source**: `system.query_log` (`memory_usage` is per-query peak).

```sql
-- Peak memory_usage: recent p95 vs baseline p95
SELECT
    quantileIf(0.95)(memory_usage,
        event_time >= now() - INTERVAL 1 HOUR)  AS p95_recent_bytes,
    quantileIf(0.95)(memory_usage,
        event_time  < now() - INTERVAL 1 HOUR
        AND event_time >= now() - INTERVAL 25 HOUR) AS p95_baseline_bytes,
    formatReadableSize(p95_recent_bytes)   AS p95_recent,
    formatReadableSize(p95_baseline_bytes) AS p95_baseline,
    round(p95_recent_bytes / nullIf(p95_baseline_bytes, 0), 2) AS ratio
FROM system.query_log
WHERE type = 'QueryFinish'
  AND is_initial_query = 1
  AND event_time >= now() - INTERVAL 25 HOUR
```

```sql
-- Top memory consumers in the last hour
SELECT
    user, substring(query, 1, 200) AS query_preview,
    formatReadableSize(memory_usage) AS mem,
    query_duration_ms
FROM system.query_log
WHERE type = 'QueryFinish'
  AND is_initial_query = 1
  AND event_time >= now() - INTERVAL 1 HOUR
ORDER BY memory_usage DESC
LIMIT 10
```

```sql
-- Current server-wide memory tracking (instantaneous)
SELECT metric, value, description
FROM system.metrics
WHERE metric IN ('MemoryTracking', 'MemoryAllocated')
```

---

## Part-Count Explosion

**Source**: `system.parts`. High active-part counts per table indicate merge
backpressure or excessive insert batching.

```sql
-- Tables with the most active parts right now
SELECT
    database,
    table,
    count() AS active_parts,
    sum(rows) AS total_rows,
    formatReadableSize(sum(bytes_on_disk)) AS disk_size
FROM system.parts
WHERE active = 1
GROUP BY database, table
ORDER BY active_parts DESC
LIMIT 30
```

```sql
-- Flag tables that exceeded a threshold in the last day
-- (join today vs yesterday snapshot via modification_time proxy)
SELECT
    database,
    table,
    countIf(modification_time >= now() - INTERVAL 1 HOUR)  AS parts_added_1h,
    countIf(modification_time >= now() - INTERVAL 25 HOUR) AS parts_total_25h,
    count() AS active_parts
FROM system.parts
WHERE active = 1
GROUP BY database, table
HAVING active_parts > 300 OR parts_added_1h > 50
ORDER BY active_parts DESC
LIMIT 20
```

Use the `get_merge_status` tool to check if background merges are keeping up. See
`troubleshooting` for error code 252 (too many parts).

---

## Replication Lag

**Source**: `system.replicas`. `absolute_delay` is seconds behind the leader.

```sql
-- Tables with non-zero replication lag
SELECT
    database,
    table,
    is_leader,
    is_readonly,
    absolute_delay,
    queue_size,
    inserts_in_queue,
    merges_in_queue,
    active_replicas,
    total_replicas
FROM system.replicas
WHERE absolute_delay > 0 OR is_readonly = 1 OR active_replicas < total_replicas
ORDER BY absolute_delay DESC
```

```sql
-- Trend: max absolute_delay across all replicated tables
SELECT
    database,
    table,
    absolute_delay,
    formatReadableTimeDelta(absolute_delay) AS lag_human
FROM system.replicas
ORDER BY absolute_delay DESC
LIMIT 10
```

For diagnosis and recovery steps, load the `replication-guide` skill.

---

## How to Interpret Results

| Signal | Threshold (guide, not absolute) | Action |
|--------|----------------------------------|--------|
| Error-rate ratio `recent_error_pct / baseline_error_pct` | > 2× | Investigate top error codes; load `troubleshooting` |
| p95 duration ratio | > 1.5× | Check new/changed queries, index usage; load `query-optimization` |
| Query volume ratio | < 0.3× or > 3× | Verify application health; check for batch jobs or traffic anomaly |
| Memory p95 ratio | > 2× | Find heavy queries; consider `max_memory_usage`; load `troubleshooting` |
| `active_parts` per table | > 300 (MergeTree default warn zone) | Check merge queue via `get_merge_status`; consider OPTIMIZE |
| `absolute_delay` | > 300 s (5 min) | Replication is lagging; load `replication-guide` |

**Noise vs real anomaly**: a ratio spike in a 1-hour window with fewer than ~50
total events is likely noise (small sample). Check the raw counts (`recent_total`,
`baseline_total`) before escalating. A sustained anomaly across two consecutive
1-hour windows is more actionable.

**Baseline window caveat**: the 24-hour baseline includes the recent 1 hour in
some queries above for simplicity. If you want a strictly prior baseline, replace
`INTERVAL 25 HOUR` with `INTERVAL 24 HOUR` and add `AND event_time < now() -
INTERVAL 1 HOUR` to the baseline predicate.

---

## Cross-references

- `system-tables-reference` — exact column names before modifying any SQL above
- `troubleshooting` — error codes, OOM, stuck mutations
- `replication-guide` — replication lag diagnosis and recovery
- `query-optimization` — EXPLAIN, PREWHERE, JOIN tuning for duration regressions
- `storage-optimization` — disk pressure if part-count explosion fills the disk
