---
name: system-tables-reference
description: "Exact column names for the system tables the agent queries most (processes, query_log, parts, merges, replicas, metrics) plus rules for choosing dedicated tools over raw SQL. Load before hand-writing SQL against system tables."
---

# System Tables Reference

Load this skill before writing raw SQL against `system.*` tables. It lists the
columns that actually exist so you don't reference hallucinated columns. When a
dedicated tool exists for what you need, call it instead of writing SQL.

## Prefer Dedicated Tools Over Raw SQL

Many questions map to a purpose-built tool. Use it — the SQL is already correct
and version-aware:

| Question | Use this tool, not raw SQL |
|----------|----------------------------|
| What is running now? | `get_running_queries` |
| Slowest finished queries? | `get_slow_queries` |
| Recent failures/errors? | `get_failed_queries` |
| Heaviest queries by memory/bytes/duration? | `get_expensive_queries` |
| Active merges? | `get_merge_status` |
| Replication health? | `get_replication_status` |
| Disk space? | `get_disk_usage` |
| Server version/uptime/connections? | `get_metrics` |

Only fall back to the `query` tool for ad-hoc questions that no dedicated tool
covers. If a dedicated tool returns an error, fix the call (e.g. `hostId` is a
number like `0`, not a string), do **not** rewrite it as raw SQL.

## system.processes — currently running queries

There is **no `database` column** on `system.processes`. Selecting it fails with
"Unknown expression identifier `database`".

Available columns:
`query_id`, `user`, `query`, `elapsed`, `read_rows`, `read_bytes`,
`written_rows`, `written_bytes`, `total_rows_approx`, `memory_usage`,
`peak_memory_usage`, `query_kind`, `is_initial_query`, `address`, `port`,
`initial_user`, `initial_query_id`, `client_name`, `thread_ids`, `ProfileEvents`,
`Settings`, `current_database`.

- Use `current_database` (not `database`) for the session's database.
- To exclude the monitoring query itself: `WHERE query NOT LIKE '%processes%'`.
  Do not invent syntax like `WHERE is_query SELECT WITHOUT '...'`.
- `elapsed` is seconds (Float64). Display with `formatReadableTimeDelta(elapsed)`.

```sql
SELECT query_id, user, current_database, elapsed, read_rows, memory_usage,
       substring(query, 1, 200) AS query
FROM system.processes
WHERE query NOT LIKE '%processes%'
ORDER BY elapsed DESC
```

## system.query_log — query history

Filter by `type` and time. Each query produces a `QueryStart` row and a finish
row (`QueryFinish` on success, `ExceptionWhileProcessing` on error). For
completed queries always filter `WHERE type = 'QueryFinish'`, otherwise you
double-count starts.

Key columns: `query_id`, `type`, `event_time`, `event_date`, `query_start_time`,
`query_duration_ms`, `read_rows`, `read_bytes`, `result_rows`, `memory_usage`,
`user`, `query`, `exception_code`, `exception`, `normalized_query_hash`,
`is_initial_query`, `databases`, `tables`, `columns`, `ProfileEvents`.

- The per-row database/table lists are `databases`/`tables`/`columns` (Array),
  not `database`/`table`.
- Add `AND is_initial_query = 1` to avoid counting internal sub-queries.

## system.parts — table parts

Has `database` and `table`. Filter `WHERE active = 1` for live parts.
Key columns: `database`, `table`, `partition`, `name`, `active`, `rows`,
`bytes_on_disk`, `data_compressed_bytes`, `data_uncompressed_bytes`,
`marks`, `modification_time`, `min_time`, `max_time`, `part_type`, `disk_name`.

Compression ratio: `data_uncompressed_bytes / data_compressed_bytes`.

## system.merges — active merges

Columns: `database`, `table`, `elapsed`, `progress` (0..1), `num_parts`,
`source_part_names`, `result_part_name`, `total_size_bytes_compressed`,
`rows_read`, `rows_written`, `memory_usage`, `is_mutation`, `merge_type`.

## system.replicas — replication status

One row per replicated table. Columns: `database`, `table`, `is_leader`,
`is_readonly`, `absolute_delay`, `queue_size`, `inserts_in_queue`,
`merges_in_queue`, `total_replicas`, `active_replicas`, `last_queue_update`,
`zookeeper_path`. Healthy = `absolute_delay = 0`, `is_readonly = 0`,
`active_replicas = total_replicas`.

## system.metrics vs system.events vs system.asynchronous_metrics

These three are easy to confuse — they use different column names:

- `system.metrics`: instantaneous gauges. Columns `metric`, `value`,
  `description`. e.g. `Query`, `TCPConnection`, `MemoryTracking`.
- `system.events`: cumulative counters. Columns `event`, `value`,
  `description` — the name column is `event`, **not** `metric`.
- `system.asynchronous_metrics`: periodically sampled. Columns `metric`,
  `value`. e.g. `Uptime`, `jemalloc.*`, disk/CPU samples.

## system.errors — error counters

Columns: `name`, `code`, `value`, `last_error_time`, `last_error_message`,
`last_error_trace`. There is no `last_update_time` column.

## Recovery Rules

- Unknown column (code 47) or unknown identifier → load this skill or call
  `get_table_schema` for the table, then retry with real column names. Do not
  guess again.
- There is no CPU% column anywhere. Approximate load via `memory_usage`,
  `read_rows`, `read_bytes` on `system.processes`, or `ProfileEvents` such as
  `OSCPUVirtualTimeMicroseconds` in `system.query_log`.

## Cross-references
- Load `query-optimization` for EXPLAIN, PREWHERE, JOIN tuning.
- Load `troubleshooting` for error-code-driven diagnosis.
