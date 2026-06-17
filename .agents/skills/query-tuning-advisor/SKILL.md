---
name: query-tuning-advisor
description: "Diagnose a slow or expensive query with EXPLAIN and query_log, then propose concrete rewrites and better join strategies."
---

# Query Tuning Advisor

Use this skill when a user shares a specific slow, expensive, or high-memory query and wants it made faster. The goal is a concrete **before → after** rewrite, not general advice. Load `query-optimization` for reference tables on EXPLAIN output and skip index types.

## 1. Diagnose First

Never guess. Collect evidence before proposing rewrites.

**Step 1 — EXPLAIN INDEXES** (call `explain_query` tool, type `INDEXES`):
```sql
EXPLAIN INDEXES = 1 <the query>
```
Read the output for:
- `Granules: N/M` — N granules selected out of M total. N ≈ M means a full scan; skip indexes are not firing.
- `Keys: <expr>` — confirms which primary key ranges were used.
- Missing keys = predicates don't align with the table's `ORDER BY`.

**Step 2 — EXPLAIN PLAN** (type `PLAN`, actions=1):
```sql
EXPLAIN actions = 1 <the query>
```
Look for: `Filter`, `ReadFromMergeTree` with no pushdown, large `Aggregating` steps, or a `JOIN` where the build side is large.

**Step 3 — Find it in query_log** (call `query` tool):
```sql
SELECT
    query_duration_ms,
    read_rows,
    result_rows,
    read_rows / nullIf(result_rows, 0) AS scan_ratio,
    memory_usage,
    ProfileEvents['SelectedMarks']        AS marks_read,
    ProfileEvents['SelectedRangesOfMarks'] AS ranges_read,
    query
FROM system.query_log
WHERE type = 'QueryFinish'
  AND is_initial_query = 1
  AND normalized_query_hash = cityHash64('<the query with literals replaced by ?>')
ORDER BY event_time DESC
LIMIT 5
```
Key signals:
- `scan_ratio` > 100 → reading far more rows than returned; likely full scan or missing PREWHERE.
- `marks_read` close to total table marks → primary key not used.
- `memory_usage` > 1 GiB → GROUP BY or JOIN materializing too much.

---

## 2. PREWHERE and Predicate Placement

ClickHouse evaluates `PREWHERE` before reading all columns — it reads only the filter column(s) first, skips non-matching granules, then fetches the rest. The optimizer promotes simple `WHERE` conditions automatically, but it doesn't always get it right.

**Rules:**
- Move the most selective, cheapest-to-read condition into `PREWHERE` manually when the optimizer misses it.
- Avoid expressions in `PREWHERE` that reference non-stored columns or require decompression of wide columns.
- Never use `PREWHERE` with `FINAL` on a ReplacingMergeTree — it can produce wrong results.

```sql
-- Before
SELECT url, status, body
FROM access_log
WHERE toDate(event_time) = today()
  AND status = 500

-- After: push the narrow int filter to PREWHERE
SELECT url, status, body
FROM access_log
PREWHERE status = 500
WHERE toDate(event_time) = today()
```

Also: move date/time range filters to align with the primary key order so they prune granules before PREWHERE even runs.

---

## 3. Better JOINs

### Join order
ClickHouse's hash join builds a hash table from the **right** table and probes with the **left** table. Put the **smaller** table on the right.

```sql
-- Before: large table on right (built into hash table)
SELECT * FROM small_dim JOIN large_fact USING (id)

-- After: large table on left (probed), small on right (built)
SELECT * FROM large_fact JOIN small_dim USING (id)
```

### Choose the right join_algorithm

| Situation | Setting |
|---|---|
| Right table fits in memory (default, < ~few GB) | `join_algorithm = 'hash'` |
| Right table too large for RAM | `join_algorithm = 'partial_merge'` (spills to disk) |
| Both sides sorted on join key | `join_algorithm = 'full_sorting_merge'` (no hash table) |
| ClickHouse should decide | `join_algorithm = 'auto'` (v22.9+) |
| Distributed query, right table is small | `GLOBAL JOIN` (broadcasts right table to all shards) |

Set per-query: `SELECT ... FROM a JOIN b USING (k) SETTINGS join_algorithm = 'partial_merge'`

### IN / semi-join instead of JOIN

When you only need to filter rows (not project columns from the right side), `IN` is cheaper than `JOIN` — it avoids materializing the joined columns:

```sql
-- Before: full JOIN just to filter
SELECT l.* FROM orders l JOIN vip_customers r ON l.customer_id = r.id

-- After: semi-join via IN
SELECT * FROM orders WHERE customer_id IN (SELECT id FROM vip_customers)
```

### Avoid cartesian blowups

- Always specify `ON` or `USING`. A missing condition produces a cross join.
- Check `read_rows` in query_log — if it equals `left_rows × right_rows`, you have a cartesian product.
- For many-to-many relationships, pre-aggregate one side before joining.

---

## 4. Avoiding Full Scans

### Align filters with ORDER BY / primary key

ClickHouse primary key = `ORDER BY` columns. Filters on those columns prune granules; filters on other columns scan everything.

```sql
-- Table: ORDER BY (tenant_id, event_date, event_type)
-- Bad: event_type filter alone cannot prune granules
WHERE event_type = 'purchase'

-- Good: leading columns first, then event_type
WHERE tenant_id = 42 AND event_date >= '2024-01-01' AND event_type = 'purchase'
```

### Skip indexes

Add a skip index when you often filter on a non-primary-key column:

```sql
-- For low-cardinality status columns
ALTER TABLE events ADD INDEX idx_status (status) TYPE set(100) GRANULARITY 4;

-- For high-cardinality string equality (e.g. trace_id)
ALTER TABLE events ADD INDEX idx_trace (trace_id) TYPE bloom_filter GRANULARITY 1;

-- For range queries on a secondary numeric column
ALTER TABLE events ADD INDEX idx_latency (latency_ms) TYPE minmax GRANULARITY 4;
```

After adding, materialize: `ALTER TABLE events MATERIALIZE INDEX idx_status;`

Verify it fires: `EXPLAIN INDEXES = 1 <query>` — look for the index name in the output and a reduced granule count.

---

## 5. Aggregation Tuning

- **Avoid `SELECT *`** in aggregation queries — fetch only the columns you aggregate or group on.
- **Push `LIMIT` down**: use `LIMIT` in subqueries and CTEs to cap intermediate sets before joining or grouping.
- **Use approximate functions** when exactness isn't required:
  - `uniqHLL12(x)` instead of `uniq(x)` or `COUNT(DISTINCT x)` — ~1% error, 10× less memory.
  - `quantileTDigest(0.95)(latency)` instead of `quantile(0.95)(latency)` — mergeable, streaming-friendly.
  - `topK(10)(x)` instead of `GROUP BY x ORDER BY count() DESC LIMIT 10` for heavy-hitter approximation.
- **GROUP BY memory**: if `memory_usage` is high on aggregation, try `max_bytes_before_external_group_by` to spill to disk, or switch to two-level aggregation with `group_by_two_level_threshold`.
- **Pre-aggregate with materialized views**: if the same aggregation runs frequently, maintain a `SummingMergeTree` or `AggregatingMergeTree` target and query that instead.

---

## 6. Before → After Worked Example

**User reports**: "This query takes 45 seconds and reads 2 billion rows."

```sql
-- BEFORE
SELECT
    user_id,
    COUNT(*) AS cnt,
    uniq(session_id) AS sessions
FROM events
JOIN users ON events.user_id = users.id
WHERE event_type = 'page_view'
  AND toYear(event_time) = 2024
GROUP BY user_id
ORDER BY cnt DESC
LIMIT 100
```

**Diagnosis:**
1. `EXPLAIN INDEXES` shows `Granules: 9800/9800` → full scan (event_type not in ORDER BY).
2. `uniq(session_id)` in query_log shows `memory_usage = 3.2 GiB`.
3. `users` is 50 M rows — large right table.

**After:**
```sql
-- AFTER
SELECT
    user_id,
    COUNT(*) AS cnt,
    uniqHLL12(session_id) AS sessions   -- ~1% error, 10x less memory
FROM events
PREWHERE event_type = 'page_view'       -- PREWHERE prunes granules early
WHERE event_time >= '2024-01-01'        -- aligns with ORDER BY (event_time in PK)
  AND event_time <  '2025-01-01'
GROUP BY user_id
ORDER BY cnt DESC
LIMIT 100
-- users JOIN removed: not needed for this output
```

**Rationale:**
- `PREWHERE event_type` reads only the narrow column first, skips non-matching granules.
- Date range on `event_time` (primary key leading column) prunes ~90% of granules.
- `uniqHLL12` cuts aggregation memory from 3.2 GiB to ~300 MiB.
- `JOIN users` removed — user_id is already in `events`, users columns not projected.

---

## 7. Tuning Checklist

Run through this when asked "make this query faster":

- [ ] `EXPLAIN INDEXES` — are granules being pruned? If `N ≈ M`, filters don't hit primary key.
- [ ] `EXPLAIN PLAN` — is there a large build-side JOIN? A fat Aggregating step?
- [ ] `query_log` — check `scan_ratio` (read_rows / result_rows) and `memory_usage`.
- [ ] Filters on primary key leading columns? If not, reorder WHERE or add skip index.
- [ ] `PREWHERE` on the most selective cheap column?
- [ ] JOIN: smaller table on the right? Right `join_algorithm` for table sizes?
- [ ] Can `JOIN` be replaced by `IN` (semi-join) if right-side columns aren't projected?
- [ ] `SELECT *` → replace with explicit column list.
- [ ] `uniq()` / `COUNT(DISTINCT)` → `uniqHLL12()` if approximate is fine.
- [ ] `quantile()` → `quantileTDigest()` for percentile aggregations.
- [ ] Frequent aggregation → candidate for a materialized view pre-aggregation.
- [ ] Date arithmetic in WHERE (`toYear(ts) = 2024`) → replace with range filter on raw column.

---

## Cross-references
- `query-optimization` — EXPLAIN output reference, ProfileEvents counters, optimizer settings.
- `schema-design-advisor` — fixing slow queries at the schema level (ORDER BY, partition key, skip indexes at table creation).
- `data-analysis` — exploratory SQL patterns for understanding data shape before tuning.
- `system-tables-reference` — exact column names for `system.query_log`, `system.processes`.
