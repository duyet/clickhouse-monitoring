---
name: concept-explainer
description: "Explains core ClickHouse concepts with accurate mental models — MergeTree, indexes, replication, sharding, and special engines."
---

# ClickHouse Concept Explainer

Use this skill when a user asks "what is X", "explain Y", or "how does Z work". Give the right mental model first, add a concrete example, then offer to go deeper. Tailor detail to the user's apparent experience level.

## MergeTree Family & How Merges Work

Every insert creates one or more immutable **parts** on disk (a directory of column files + index). ClickHouse merges these parts in the background — combining small parts into larger ones, re-sorting data, applying deduplication or aggregation depending on the engine variant. Until a merge happens, the same logical row may exist across multiple parts.

**Why small inserts are bad**: each INSERT of 10 rows creates a tiny part. Parts accumulate faster than the background merger can keep up, hitting the `too many parts` error (default threshold: 300 parts per partition). Always batch at least 1 000–10 000 rows per insert; use async inserts for high-frequency small writes.

```sql
-- Check live part counts per table
SELECT table, count() AS parts, sum(rows) AS total_rows
FROM system.parts
WHERE active AND database = currentDatabase()
GROUP BY table ORDER BY parts DESC;
```

Cross-reference: `clickhouse-best-practices` for insert batching settings.

## Sparse Primary Index / Primary Key

ClickHouse does **not** build a per-row B-tree index. Instead it stores one index entry per **granule** (default 8 192 rows, set by `index_granularity`). Each entry records the primary key value at the start of that granule.

At query time ClickHouse binary-searches these sparse marks, selects the minimal set of granules that could match, and reads only those blocks from disk. The primary key is **not unique** — duplicates are allowed and common. Its sole purpose is to sort data on disk so range scans skip irrelevant granules.

```sql
-- Effective only when filtering on leading primary-key columns:
SELECT count() FROM events WHERE user_id = 42 AND event_date >= today() - 7;
-- user_id must be the first or second ORDER BY column to benefit from the index.
```

Cross-reference: `query-optimization` for `EXPLAIN INDEXES` and skip indexes.

## ORDER BY vs PARTITION BY vs PRIMARY KEY

These three clauses look similar but serve different purposes:

| Clause | Role |
|---|---|
| `ORDER BY (a, b)` | Physical sort order within each part; **defines the primary key** by default |
| `PARTITION BY expr` | Splits data into independent sub-trees; each partition has its own parts |
| `PRIMARY KEY (a)` | Override the index prefix (rarely needed; defaults to full `ORDER BY`) |

**Partitioning rule of thumb**: partition on a low-cardinality column (e.g., `toYYYYMM(date)`). Each partition is merged independently; over-partitioning (millions of partitions) slows queries and maintenance. Most tables need no explicit `PARTITION BY` or just a monthly/daily date partition.

Cross-reference: `schema-design-advisor` for partition sizing guidance.

## Columnar Storage & Compression

ClickHouse stores each column in its own file. A query reading only 3 out of 100 columns touches ~3% of the data. Within a column file, values are stored consecutively, so they compress extremely well — identical or slowly-changing values in sorted data often achieve 5–20× compression with LZ4 (default) or ZSTD.

Per-column codecs let you tune further:

```sql
CREATE TABLE metrics (
    ts    DateTime CODEC(DoubleDelta, ZSTD),  -- timestamps: delta + entropy coding
    value Float64  CODEC(Gorilla, ZSTD)       -- float series: XOR delta
) ENGINE = MergeTree ORDER BY ts;
```

This is why ClickHouse wins on analytical queries: it reads far less data off disk than row-oriented databases, and what it does read is compact.

## Replication

`ReplicatedMergeTree` keeps two or more replicas in sync through **ClickHouse Keeper** (or ZooKeeper). The coordination protocol works like this:

1. One replica receives an insert, writes a part locally, and **logs the operation** to Keeper.
2. Other replicas see the log entry and fetch the part (either from the leader or from each other).
3. Each replica applies merges independently but uses Keeper to agree on **which parts to merge** so they converge to identical state.

Replication is **eventually consistent**: a fresh replica may not yet have a just-inserted row. Use `SYSTEM SYNC REPLICA` to wait for a replica to catch up, or enable `insert_quorum` to make inserts wait for N replicas before acknowledging.

Cross-reference: `replication-guide` for quorum settings and Keeper health checks.

## Sharding & Distributed Tables

**Shard**: an independent subset of data, typically one `ReplicatedMergeTree` table (with its own replicas). Sharding is horizontal scaling — more shards = more total data capacity and parallelism.

**Distributed engine**: a virtual table that fans out queries to all shards and merges results. It stores no data itself.

```sql
CREATE TABLE events_dist AS events
ENGINE = Distributed('my_cluster', currentDatabase(), 'events', rand());
-- rand() = random shard key; replace with cityHash64(user_id) for colocation
```

A write to the `Distributed` table is routed to one shard (per the shard key). A `SELECT` is broadcast to all shards and results are merged on the query initiator. Use `GLOBAL JOIN` when joining a Distributed table against another, to avoid N×M fan-out.

Cross-reference: `cluster-operations` for cluster topology and `query-optimization` for GLOBAL JOIN.

## Materialized Views & Projections

Both compute derived data automatically on insert, but they serve different purposes:

**Materialized view**: an independent table populated by a trigger query that runs on every insert into the source table. Use for pre-aggregating into a separate table, routing subsets to different engines, or transforming schemas.

```sql
CREATE MATERIALIZED VIEW hourly_counts
ENGINE = SummingMergeTree ORDER BY (hour, event)
AS SELECT toStartOfHour(ts) AS hour, event, count() AS cnt
FROM events GROUP BY hour, event;
```

**Projection**: an alternative sort order or pre-aggregation stored *inside* the same table. ClickHouse automatically picks the best projection at query time. Projections update atomically with the parent table and stay consistent across replicas.

Use projections when you want a secondary sort key without managing a separate table. Use materialized views when you need a different engine, schema, or destination cluster.

## Special MergeTree Engine Variants

| Engine | Problem it solves |
|---|---|
| `ReplacingMergeTree(ver)` | Keeps only the latest version of a row with the same primary key (deduplication). Final dedup happens at merge time or with `FINAL`; duplicates may be visible until then. |
| `AggregatingMergeTree` | Stores partial aggregation states (e.g., `AggregateFunction(sum, UInt64)`) so that merges combine states rather than raw rows. Typically used as the target of a materialized view. |
| `SummingMergeTree(cols)` | Sums specified numeric columns during merges for rows with identical primary key. Simple pre-aggregation without partial states. |
| `CollapsingMergeTree(sign)` | Cancels rows by pairing a `sign=1` (insert) row with a `sign=-1` (delete/update) row sharing the same primary key. Merges collapse the pair to nothing. Used for update-heavy fact tables. |

All variants still inherit the full MergeTree behaviour (parts, background merges, sparse index). They differ only in what happens **during** a merge.

## PREWHERE vs WHERE

`PREWHERE` is read first, on only the columns it references, before the rest of the row is decoded. `WHERE` is evaluated after all selected columns are read. Use `PREWHERE` for highly selective conditions on narrow columns to skip reading wide columns for most rows. ClickHouse applies this optimization automatically for simple conditions when `optimize_move_to_prewhere = 1` (default on).

```sql
-- Manual hint: filter on the cheap column first, avoid reading `payload` for 99% of rows
SELECT payload FROM events PREWHERE event = 'purchase' WHERE amount > 1000;
```

---

*Ask follow-up questions to go deeper on any concept. For query tuning see `query-optimization`; for schema choices see `schema-design-advisor`; for cluster topology see `cluster-operations` and `replication-guide`.*
