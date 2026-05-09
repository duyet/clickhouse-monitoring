---
name: clickhouse-best-practices
description: "Production operational practices: insert batching, async writes, query cache, connection pooling, and recommended settings."
---

# ClickHouse Best Practices

## Insert Best Practices

- Batch 10k-100k rows per insert; max 1-2 inserts/sec per table
- Sub-1k-row inserts cause part proliferation; insert in sorting-key order to reduce merge work
- For bulk loads, tune `min_insert_block_size_rows` / `max_insert_block_size_rows`

## Async Inserts

- `SET async_insert = 1; SET wait_for_async_insert = 1;` (1=durable, 0=fire-and-forget)
- Tune `async_insert_max_data_size` (1M) and `async_insert_busy_timeout_ms` (10s) for batch window

## Query Cache (v23.5+)

- `SET allow_experimental_query_cache = 1; SET use_query_cache = 1;`
- TTL: `query_cache_ttl`; share across users: `query_cache_shared_between_users = 1`
- Control: `enable_writes_to_query_cache`, `enable_reads_from_query_cache`

## Connection Pooling

- HTTP: set `pool_size`, `max_queries`; keep-alive is critical
- TCP: built-in multiplexing; tune `max_connections`
- Monitor `system.metrics` for `HTTPConnection`/`TCPConnection` to size pools

## Production Settings

- `max_threads` — lower for concurrent loads; `max_insert_threads` — raise for parallel inserts
- `max_execution_time` / `max_memory_usage` — per-query limits
- `join_algorithm` — prefer `grace_hash` or `auto` for large joins
- `input_format_allow_errors_num` / `ratio` — tolerate parse errors in bulk imports

## Query Patterns

- `COLUMNS('pattern')` — regex column selection; `APPLY func` transforms matches
- `clusterAllReplicas('cluster')` — aggregate across all replicas
- `FINAL` — force merge for ReplacingMergeTree; use sparingly (full scan)
