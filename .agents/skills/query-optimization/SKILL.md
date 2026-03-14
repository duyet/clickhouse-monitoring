---
name: query-optimization
description: "Query optimization strategies: PREWHERE, JOIN patterns, materialized views, EXPLAIN analysis, index usage, and query profiling."
---

# Query Optimization

## When to use this skill
Load when users ask about slow queries, optimization strategies, or query performance tuning.

## PREWHERE Optimization
- PREWHERE filters rows before reading all columns (MergeTree only)
- ClickHouse auto-promotes simple WHERE conditions to PREWHERE
- Manually use PREWHERE for complex conditions on indexed columns
- Best when filtering on columns NOT in the SELECT list

## JOIN Strategies
- Put smaller table on RIGHT side of JOIN
- Use `IN` subquery for simple lookups instead of JOIN
- Filter both sides before joining to reduce intermediate data
- `GLOBAL JOIN` for distributed queries — broadcasts small table to all shards
- `JOIN ... USING` is cleaner than `ON` for same-name columns
- Consider `join_algorithm` setting: hash (default), partial_merge, auto

## Materialized Views
- Incremental aggregation: `CREATE MATERIALIZED VIEW mv TO target AS SELECT ... FROM source`
- Pre-compute expensive aggregations (counts, sums, uniq)
- Use AggregatingMergeTree for complex aggregate states
- Pattern: raw events → materialized view → aggregated table
- Multiple MVs on same source table for different query patterns

## EXPLAIN Analysis
- `EXPLAIN PLAN` — logical query plan, shows transformations
- `EXPLAIN PIPELINE` — physical execution pipeline with parallelism
- `EXPLAIN INDEXES` — which indexes are used, granules selected
- Look for: full table scans, excessive granule reads, missing index usage
- Compare `read_rows` vs `result_rows` in query_log for scan efficiency

## Index Usage
- Primary index: columns in ORDER BY, checked first
- Skip indexes: `minmax`, `set`, `bloom_filter`, `tokenbf_v1`
- `minmax` — range queries on numeric/date columns
- `bloom_filter` — equality checks on high-cardinality strings
- `set(N)` — stores N unique values per granule, good for low-cardinality
- Check index effectiveness: `system.query_log` ProfileEvents

## Query Profiling
- `system.query_log` with `type = 'QueryFinish'` for completed queries
- Key columns: `query_duration_ms`, `read_rows`, `read_bytes`, `memory_usage`
- `ProfileEvents` map contains detailed counters (SelectedRows, MergedRows, etc.)
- Use `normalized_query_hash` to group similar queries
- Compare `read_rows` / `result_rows` ratio — high ratio = inefficient scan

## Common Anti-Patterns
- `SELECT *` — reads all columns, wastes I/O
- Missing LIMIT on exploratory queries
- JOINing large tables without pre-filtering
- Using `FINAL` without understanding the cost (full merge on read)
- Sorting by non-indexed columns on large result sets
