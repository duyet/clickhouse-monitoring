---
name: query-optimization
description: "Advanced query tuning: join algorithms, skip index selection, EXPLAIN interpretation, ProfileEvents profiling, and optimizer settings."
---

# Query Optimization

## JOIN Strategies
- `join_algorithm` setting: `hash` (default, in-memory), `partial_merge` (spills to disk for large right table), `auto` (lets ClickHouse decide)
- `JOIN ... USING` avoids repeated column names vs `ON` for same-name columns
- Filter both sides before joining to reduce intermediate data
- `GLOBAL JOIN` broadcasts the right table to all shards for distributed queries

## EXPLAIN Analysis
- `EXPLAIN PLAN` — logical plan, shows projection/pushdown transformations
- `EXPLAIN PIPELINE` — physical execution with parallelism info and port counts
- `EXPLAIN INDEXES` — which indexes fire, granules selected vs total
- Look for: full table scans, missing index usage, excessive granule reads

## Index Usage
- Skip index types with use-cases:
  - `minmax` — range queries on numeric/date columns
  - `set(N)` — equality on low-cardinality columns, stores N unique values per granule
  - `bloom_filter` — equality on high-cardinality strings
  - `tokenbf_v1` — tokenized text search (logs, URLs)
- Check effectiveness via `ProfileEvents['SelectedRows']` vs result size

## Query Profiling
- `ProfileEvents` map counters: `SelectedRows`, `MergedRows`, `FileOpen`, `SeekCount`
- `normalized_query_hash` to group parameterized query variants
- `system.query_log` columns: `query_duration_ms`, `memory_usage`, `read_bytes`

## Optimizer Settings
- `enable_optimizer = 1` — activates ClickHouse's new cost-based query optimizer (v22.6+)
- `max_threads` — controls query parallelism; higher = faster but more memory; lower for concurrent workloads
- `prefer_localhost_replica = 1` — avoids network round-trip by reading from local replica on distributed queries
- `system.query_plan` (v23.6+) — persisted query plans for analysis across runs
