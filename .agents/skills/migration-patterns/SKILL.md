---
name: migration-patterns
description: "Schema migrations: ALTER patterns, engine changes, zero-downtime swaps, clickhouse-local offline migrations, and lightweight UPDATE/DELETE strategies."
---

# Migration Patterns

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

## EXCHANGE TABLES (v22.5+)
- Atomic swap without RENAME chain: `EXCHANGE TABLES t_old AND t_new`
- Simpler and safer than `RENAME TABLE t_old TO t_backup, t_new TO t_old`
- Both tables must exist and be in the same database

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

## Lightweight Mutations
- `ALTER TABLE t UPDATE col = expr WHERE condition` — async by default (`mutations_sync = 0`)
- Track progress: `SELECT * FROM system.mutations WHERE table = 't'`
- `ALTER TABLE t DELETE WHERE condition` — rewrites affected parts
- Throttle impact: set `max_rows_per_mutation` to limit rows per mutation batch
- Always schedule heavy mutations off-peak; monitor `system.mutations` for completion

## Cross-Server Migration
- Use `remote()` table function to copy between servers:
```sql
INSERT INTO local_db.t SELECT * FROM remote('source_host:9000', 'db', 't', 'user', 'pass')
```
- For large tables, batch by partition or use `clickhouse-local` offline approach

## clickhouse-local Offline Migrations
- Run migrations without a running server: `clickhouse-local --file migration.sql`
- Useful for schema changes on cold data or CI/CD validation
- Can operate directly on data files: `clickhouse-local -S 'col1 Type1, col2 Type2' --input-format Native < data.bin`

## Schema Migration Versioning
- Track applied migrations with a dedicated table:
```sql
CREATE TABLE _schema_migrations (name String, applied_at DateTime DEFAULT now()) ENGINE = TinyLog;
```
- Insert a row after each successful migration; check before applying
- Integrate with deployment scripts for idempotent migration runs

## Partition Operations
- `ALTER TABLE t ATTACH PARTITION id FROM other_table` — zero-copy if same structure
- `ALTER TABLE t REPLACE PARTITION id FROM other_table` — atomic swap
- `ALTER TABLE t MOVE PARTITION id TO TABLE other_table` — move data

## Common Pitfalls
- Nullable to non-Nullable requires default value for existing NULLs
- Changing ORDER BY requires table recreation
- Mutations (UPDATE/DELETE) rewrite all parts — schedule off-peak
- Test migrations on staging with production data volumes
- `EXCHANGE TABLES` fails if either table is replicated with different replica paths
