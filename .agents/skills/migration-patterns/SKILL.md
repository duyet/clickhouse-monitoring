---
name: migration-patterns
description: "Schema migrations, ALTER patterns, engine changes, data backfill, and zero-downtime migration strategies."
---

# Migration Patterns

## When to use this skill
Load when users ask about schema changes, migrations, or engine upgrades.

## ALTER TABLE Operations
- Add column: `ALTER TABLE t ADD COLUMN col Type [DEFAULT expr] [AFTER existing_col]`
- Drop column: `ALTER TABLE t DROP COLUMN col`
- Modify type: `ALTER TABLE t MODIFY COLUMN col NewType` (must be compatible)
- Rename: `ALTER TABLE t RENAME COLUMN old TO new`
- These are metadata-only operations — instant for most changes

## Engine Changes
- Cannot ALTER engine directly
- Pattern: create new table → insert from old → rename
```sql
CREATE TABLE t_new ENGINE = ReplacingMergeTree() ORDER BY id AS SELECT * FROM t_old;
RENAME TABLE t_old TO t_backup, t_new TO t_old;
```
- For large tables: use `INSERT INTO ... SELECT` with batching

## Zero-Downtime Migrations
1. Create new table with desired schema
2. Create materialized view to capture new inserts: `CREATE MATERIALIZED VIEW mv TO t_new AS SELECT ... FROM t_old`
3. Backfill historical data: `INSERT INTO t_new SELECT ... FROM t_old`
4. Verify data consistency
5. Switch application to new table
6. Drop old table and materialized view

## Data Backfill Patterns
- Batch by partition: `INSERT INTO new SELECT * FROM old WHERE toYYYYMM(date) = 202301`
- Use `max_insert_block_size` and `max_threads` for throughput control
- Monitor with `system.processes` and `system.merges`
- Verify row counts match after backfill

## Partition Operations
- `ALTER TABLE t ATTACH PARTITION id FROM other_table` — zero-copy if same structure
- `ALTER TABLE t REPLACE PARTITION id FROM other_table` — atomic swap
- `ALTER TABLE t MOVE PARTITION id TO TABLE other_table` — move data

## Common Pitfalls
- Nullable to non-Nullable requires default value for existing NULLs
- Changing ORDER BY requires table recreation
- Mutations (UPDATE/DELETE) rewrite all parts — schedule off-peak
- Test migrations on staging with production data volumes
