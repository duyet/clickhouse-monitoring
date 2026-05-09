/**
 * Auto-generated skills registry.
 * Run `bun run build:skills` to regenerate from .agents/skills/
 *
 * DO NOT EDIT MANUALLY
 */

import type { Skill } from './types'

export const SKILLS: readonly Skill[] = [
  {
    name: 'replication-guide',
    description:
      'ReplicatedMergeTree operations, failover procedures, lag diagnosis, quorum writes, and Keeper management.',
    content: `# Replication Guide

## ReplicatedMergeTree Basics
- Engine: \`ReplicatedMergeTree('/clickhouse/tables/{shard}/{database}/{table}', '{replica}')\`
- Requires ZooKeeper or ClickHouse Keeper
- All replicas are equal — any replica can accept writes
- Replication is asynchronous by default

## Monitoring Replication
- \`system.replicas\` — per-table status: \`absolute_delay\`, \`queue_size\`, \`is_leader\`, \`is_readonly\`
- \`system.replication_queue\` — pending operations: fetches, merges, mutations
- Key health indicators:
  - \`absolute_delay = 0\` — fully caught up
  - \`is_readonly = 0\` — accepting writes
  - \`queue_size < 10\` — healthy queue
  - \`active_replicas = total_replicas\` — all replicas online

## Failover Procedures
1. Check replica status: \`SELECT * FROM system.replicas WHERE is_readonly = 1\`
2. Verify Keeper connectivity: \`SELECT * FROM system.zookeeper WHERE path = '/'\`
3. If replica is readonly due to Keeper disconnect, it auto-recovers when connection restores
4. For permanent failures: \`SYSTEM DROP REPLICA 'replica_name' FROM TABLE db.table\`
5. Corrupted metadata: \`SYSTEM RESTORE REPLICA db.table\`

## Quorum Writes
- \`SET insert_quorum = 2\` — wait for N replicas to confirm
- \`SET insert_quorum_parallel = 1\` — parallel quorum inserts (v21.8+)
- \`SET insert_quorum_timeout = 60000\` — timeout in ms
- Use for critical data that must survive node failures

## Keeper Management
- ClickHouse Keeper is the recommended replacement for ZooKeeper
- Monitor: \`system.zookeeper\` table for browsing ZK tree
- Key paths: \`/clickhouse/tables/\` for table metadata
- Check Keeper health: \`SELECT * FROM system.asynchronous_metrics WHERE metric LIKE '%Keeper%'\`

## Common Issues
- **Split brain**: Multiple leaders — usually Keeper issue, restart Keeper
- **Readonly replica**: Lost Keeper session — check network, Keeper logs
- **Queue buildup**: Slow fetches — check network bandwidth, disk I/O
- **Diverged replicas**: \`SYSTEM SYNC REPLICA db.table\` to force sync
- Load the \`troubleshooting\` skill for OOM-related replica failures and disk-full scenarios.`,
  },
  {
    name: 'query-optimization',
    description:
      'Advanced query tuning: join algorithms, skip index selection, EXPLAIN interpretation, ProfileEvents profiling, and optimizer settings.',
    content: `# Query Optimization

## JOIN Strategies
- \`join_algorithm\` setting: \`hash\` (default, in-memory), \`partial_merge\` (spills to disk for large right table), \`auto\` (lets ClickHouse decide)
- \`JOIN ... USING\` avoids repeated column names vs \`ON\` for same-name columns
- Filter both sides before joining to reduce intermediate data
- \`GLOBAL JOIN\` broadcasts the right table to all shards for distributed queries

## EXPLAIN Analysis
- \`EXPLAIN PLAN\` — logical plan, shows projection/pushdown transformations
- \`EXPLAIN PIPELINE\` — physical execution with parallelism info and port counts
- \`EXPLAIN INDEXES\` — which indexes fire, granules selected vs total
- Look for: full table scans, missing index usage, excessive granule reads

## Index Usage
- Skip index types with use-cases:
  - \`minmax\` — range queries on numeric/date columns
  - \`set(N)\` — equality on low-cardinality columns, stores N unique values per granule
  - \`bloom_filter\` — equality on high-cardinality strings
  - \`tokenbf_v1\` — tokenized text search (logs, URLs)
- Check effectiveness via \`ProfileEvents['SelectedRows']\` vs result size

## Query Profiling
- \`ProfileEvents\` map counters: \`SelectedRows\`, \`MergedRows\`, \`FileOpen\`, \`SeekCount\`
- \`normalized_query_hash\` to group parameterized query variants
- \`system.query_log\` columns: \`query_duration_ms\`, \`memory_usage\`, \`read_bytes\`

## Optimizer Settings
- \`enable_optimizer = 1\` — activates ClickHouse's new cost-based query optimizer (v22.6+)
- \`max_threads\` — controls query parallelism; higher = faster but more memory; lower for concurrent workloads
- \`prefer_localhost_replica = 1\` — avoids network round-trip by reading from local replica on distributed queries
- \`system.query_plan\` (v23.6+) — persisted query plans for analysis across runs`,
  },
  {
    name: 'cluster-operations',
    description:
      'Cluster management: distributed tables, ON CLUSTER DDL, node lifecycle, resharding, load balancing, and Keeper migration.',
    content: `# Cluster Operations

## Distributed Tables
- \`CREATE TABLE dist ENGINE = Distributed(cluster, db, local_table, sharding_key)\`
- Sharding key: \`rand()\` for even distribution, \`cityHash64(user_id)\` for user affinity
- Reads: query all shards in parallel; Writes: route to correct shard or write locally

## ON CLUSTER DDL
- \`ALTER TABLE t ON CLUSTER '{cluster}' ADD COLUMN col Type\` — propagate schema to all replicas
- \`CREATE TABLE t ON CLUSTER '{cluster}' AS template_db.template_table\` — clone across shards
- \`distributed_ddl_output_mode\`: \`throw\` (fail on error), \`null\` (ignore), \`none\`, \`active\`
- Check status: \`SELECT * FROM system.distributed_ddl_queue\`

## Load Balancing and Read Routing
- \`load_balancing\`: \`random\`, \`in_order\`, \`first_or_random\`, \`nearest_hostname\`
- \`max_replica_delay_for_distributed_queries\` — skip lagging replicas
- \`fallback_to_stale_replicas_for_distributed_queries=1\` — use stale when all delayed

## Adding Nodes
1. Install ClickHouse on new node
2. Configure Keeper/ZooKeeper connection
3. Update cluster config (\`remote_servers\`) on all nodes
4. Create local tables on new node
5. ReplicatedMergeTree: data syncs automatically; non-replicated: copy or re-insert

## Removing Nodes
1. Stop writes, wait for replication queue to drain
2. \`SYSTEM DROP REPLICA\` for replicated tables
3. Remove from cluster config, restart remaining nodes

## Resharding
- No native online resharding — create new distributed table with new sharding scheme
- \`INSERT INTO new_dist SELECT * FROM old_dist\` or \`clickhouse-copier\` for large migrations

## Cluster Recovery
- \`SYSTEM RESTART REPLICA ON CLUSTER '{cluster}'\` — restart replication across all nodes
- \`SYSTEM SYNC REPLICA ON CLUSTER '{cluster}'\` — force sync from ZooKeeper
- \`SYSTEM FETCH PARTS ON CLUSTER '{cluster}'\` — pull missing parts from other replicas

## Monitoring Clusters
- \`system.clusters\` — topology; \`system.distributed_ddl_queue\` — DDL status; \`system.replicas\` — replication
- Cross-shard queries: use Distributed table or \`remote()\` function

## Keeper Migration (ZooKeeper to ClickHouse Keeper)
1. Deploy ClickHouse Keeper alongside ZooKeeper
2. Snapshot data: \`clickhouse-keeper-converter\` or \`zk-dump.sh\`
3. Configure Keeper with converted snapshot
4. Update \`zookeeper\` config, restart one node at a time
5. Verify replication recovers, then remove ZooKeeper`,
  },
  {
    name: 'troubleshooting',
    description:
      'Diagnose and resolve ClickHouse issues: OOM, slow merges, stuck mutations, query failures with error codes, and systematic error clustering.',
    content: `# Troubleshooting Guide

## OOM (Out of Memory)
**Diagnosis**: \`system.query_log\` WHERE \`memory_usage\` is high. \`system.metrics\` WHERE metric = 'MemoryTracking'.

**Solutions**:
- \`max_memory_usage\` per query (e.g., 10GB), \`max_memory_usage_for_user\` per user
- \`max_bytes_before_external_group_by\` / \`max_bytes_before_external_sort\` for spill-to-disk
- Reduce JOIN sizes with pre-filtering; use SAMPLE for approximate aggregations

## Slow Merges
**Diagnosis**: \`system.merges\` — check \`elapsed\`, \`progress\`, \`total_size_bytes_compressed\`. \`system.part_log\` WHERE event_type = 'MergeParts' for throughput. Too many parts: \`max_parts_count_for_partition\` in \`system.asynchronous_metrics\`.

**Solutions**:
- Increase \`background_pool_size\` (default: 16)
- Check disk I/O via \`system.asynchronous_metrics\` (ReadBufferFromFileDescriptorReadBytes)
- Batch larger inserts to reduce frequency; avoid excessive partitioning
- \`OPTIMIZE TABLE ... FINAL\` to force merge (expensive, off-peak only)

## Stuck Mutations
**Diagnosis**: \`system.mutations\` WHERE is_done = 0 — check \`parts_to_do\`, \`latest_fail_reason\`. Mutations block new merges on affected parts.

**Solutions**:
- \`KILL MUTATION WHERE mutation_id = '...'\` to cancel
- Fix underlying issue (schema mismatch, disk space), then re-submit
- Prefer INSERT + ReplacingMergeTree over UPDATE mutations

## Query Failures
**Diagnosis**: \`system.query_log\` WHERE type = 'ExceptionWhileProcessing'. Use error clustering to find patterns:
\`\`\`sql
SELECT exception_code, count(), topK(10)(exception)
FROM system.query_log
WHERE type = 'ExceptionWhileProcessing'
GROUP BY exception_code ORDER BY count() DESC
\`\`\`
For persistent errors, check \`system.error_log\` (requires error logging enabled).

**Common error codes**:
- **60**: table not found — verify table exists, check database name
- **47**: unknown column — use \`get_table_schema\` to check column names
- **241**: memory limit — reduce scope, add LIMIT, use SAMPLE
- **159**: timeout — add time filters, use LIMIT
- **252**: too many parts — wait for merges or OPTIMIZE

## Network Connectivity
**Diagnosis**: Check inter-server connectivity for replication or distributed queries. Verify \`interserver_http_port\` is reachable between nodes. Test with \`curl http://<peer>:9009\`. Check firewall rules and DNS resolution.

## Cross-references
- Load the \`replication-guide\` skill for replication lag diagnosis and recovery.
- Load the \`storage-optimization\` skill for disk recovery and tiered storage management.`,
  },
  {
    name: 'security-hardening',
    description:
      'RBAC configuration, row policies, quotas, network security, audit logging, and access control best practices.',
    content: `# Security Hardening

## RBAC (Role-Based Access Control)
- Create roles: \`CREATE ROLE analyst\`
- Grant permissions: \`GRANT SELECT ON db.* TO analyst\`
- Assign to users: \`GRANT analyst TO user1\`
- Hierarchical: roles can inherit from other roles
- Check grants: \`SHOW GRANTS FOR user1\`
- Inspect user: \`SHOW CREATE USER username\`
- Password rotation: \`ALTER USER username IDENTIFIED BY 'new_password'\`

## Row Policies
- Restrict row access per user: \`CREATE ROW POLICY p ON db.table FOR SELECT USING tenant_id = currentUser()\`
- Policies are AND-ed together
- Use for multi-tenant data isolation
- Check policies: \`system.row_policies\`

## Quotas
- Limit resource usage per user/IP: \`CREATE QUOTA q FOR user1 ... LIMIT max_queries = 100\`
- Quota intervals: per hour, per day, etc.
- Limits: max_queries, max_result_rows, max_read_rows, max_execution_time
- Monitor: \`system.quota_usage\`

## Network Security
- Restrict user access by IP: \`CREATE USER u HOST IP '10.0.0.0/8'\`
- Use TLS for client connections
- Inter-server encryption for replication
- Separate ports for internal vs external access

## Audit Logging
- Enable \`system.session_log\` for login tracking
- \`system.query_log\` records all queries with user info
- \`system.text_log\` for server-level events
- Configure log retention with TTL

## Best Practices
- Principle of least privilege — grant only needed permissions
- Use roles, not direct user grants
- Separate read-only and admin users
- Enable quotas for all non-admin users
- Regular audit of grants and access patterns
- Use \`readonly = 1\` setting for monitoring connections`,
  },
  {
    name: 'migration-patterns',
    description:
      'Schema migrations: ALTER patterns, engine changes, zero-downtime swaps, clickhouse-local offline migrations, and lightweight UPDATE/DELETE strategies.',
    content: `# Migration Patterns

## ALTER TABLE Operations
- Add column: \`ALTER TABLE t ADD COLUMN col Type [DEFAULT expr] [AFTER existing_col]\`
- Drop column: \`ALTER TABLE t DROP COLUMN col\`
- Modify type: \`ALTER TABLE t MODIFY COLUMN col NewType\` (must be compatible)
- Rename: \`ALTER TABLE t RENAME COLUMN old TO new\`
- These are metadata-only operations — instant for most changes

## Engine Changes
- Cannot ALTER engine directly
- Pattern: create new table → insert from old → rename
\`\`\`sql
CREATE TABLE t_new ENGINE = ReplacingMergeTree() ORDER BY id AS SELECT * FROM t_old;
RENAME TABLE t_old TO t_backup, t_new TO t_old;
\`\`\`
- For large tables: use \`INSERT INTO ... SELECT\` with batching

## EXCHANGE TABLES (v22.5+)
- Atomic swap without RENAME chain: \`EXCHANGE TABLES t_old AND t_new\`
- Simpler and safer than \`RENAME TABLE t_old TO t_backup, t_new TO t_old\`
- Both tables must exist and be in the same database

## Zero-Downtime Migrations
1. Create new table with desired schema
2. Create materialized view to capture new inserts: \`CREATE MATERIALIZED VIEW mv TO t_new AS SELECT ... FROM t_old\`
3. Backfill historical data: \`INSERT INTO t_new SELECT ... FROM t_old\`
4. Verify data consistency
5. Switch application to new table
6. Drop old table and materialized view

## Data Backfill Patterns
- Batch by partition: \`INSERT INTO new SELECT * FROM old WHERE toYYYYMM(date) = 202301\`
- Use \`max_insert_block_size\` and \`max_threads\` for throughput control
- Monitor with \`system.processes\` and \`system.merges\`
- Verify row counts match after backfill

## Lightweight Mutations
- \`ALTER TABLE t UPDATE col = expr WHERE condition\` — async by default (\`mutations_sync = 0\`)
- Track progress: \`SELECT * FROM system.mutations WHERE table = 't'\`
- \`ALTER TABLE t DELETE WHERE condition\` — rewrites affected parts
- Throttle impact: set \`max_rows_per_mutation\` to limit rows per mutation batch
- Always schedule heavy mutations off-peak; monitor \`system.mutations\` for completion

## Cross-Server Migration
- Use \`remote()\` table function to copy between servers:
\`\`\`sql
INSERT INTO local_db.t SELECT * FROM remote('source_host:9000', 'db', 't', 'user', 'pass')
\`\`\`
- For large tables, batch by partition or use \`clickhouse-local\` offline approach

## clickhouse-local Offline Migrations
- Run migrations without a running server: \`clickhouse-local --file migration.sql\`
- Useful for schema changes on cold data or CI/CD validation
- Can operate directly on data files: \`clickhouse-local -S 'col1 Type1, col2 Type2' --input-format Native < data.bin\`

## Schema Migration Versioning
- Track applied migrations with a dedicated table:
\`\`\`sql
CREATE TABLE _schema_migrations (name String, applied_at DateTime DEFAULT now()) ENGINE = TinyLog;
\`\`\`
- Insert a row after each successful migration; check before applying
- Integrate with deployment scripts for idempotent migration runs

## Partition Operations
- \`ALTER TABLE t ATTACH PARTITION id FROM other_table\` — zero-copy if same structure
- \`ALTER TABLE t REPLACE PARTITION id FROM other_table\` — atomic swap
- \`ALTER TABLE t MOVE PARTITION id TO TABLE other_table\` — move data

## Common Pitfalls
- Nullable to non-Nullable requires default value for existing NULLs
- Changing ORDER BY requires table recreation
- Mutations (UPDATE/DELETE) rewrite all parts — schedule off-peak
- Test migrations on staging with production data volumes
- \`EXCHANGE TABLES\` fails if either table is replicated with different replica paths`,
  },
  {
    name: 'storage-optimization',
    description:
      'Compression codecs, TTL policies, tiered storage, part management, and disk space optimization.',
    content: `# Storage Optimization

## Compression Codecs
- Default: LZ4 — fast, moderate compression
- \`ZSTD(level)\` — better compression, slower. Level 1-22 (3 is good default)
- \`Delta\` + ZSTD — excellent for time-series monotonic data
- \`DoubleDelta\` — best for timestamps and counters
- \`Gorilla\` — optimized for floating-point gauge metrics
- \`T64\` — for integer columns with small range
- Per-column: \`ALTER TABLE t MODIFY COLUMN col TYPE UInt32 CODEC(Delta, ZSTD(3))\`
- In-place codec change: \`ALTER TABLE t MODIFY COLUMN col CODEC(Delta, ZSTD(3))\`

## TTL Policies
- Table-level: \`ALTER TABLE t MODIFY TTL event_time + INTERVAL 90 DAY\`
- Column-level: \`ALTER TABLE t MODIFY COLUMN old_col TTL event_time + INTERVAL 30 DAY\`
- Move to volume: \`TTL event_time + INTERVAL 7 DAY TO VOLUME 'cold'\`
- Delete: \`TTL event_time + INTERVAL 365 DAY DELETE\`
- Monitor TTL merges: \`system.merges WHERE is_ttl_merge = 1\`

## Tiered Storage
- Define storage policies in config: hot (SSD) → warm (HDD) → cold (S3)
- \`<storage_configuration>\` in config.xml
- Move rules: \`TTL event_time + INTERVAL 7 DAY TO DISK 'hdd'\`
- Check disk usage: \`system.disks\`
- Check volume usage: \`system.storage_policies\`

## Part Management
- Monitor part count: \`SELECT count() FROM system.parts WHERE active AND database = 'db' AND table = 't'\`
- Too many parts (>300 per partition) = degraded performance
- Detached parts: check \`system.detached_parts\`, clean with \`DROP DETACHED PART\`
- Part size target: 1-10GB per part for optimal performance

## Disk Space Recovery
- \`DROP PARTITION\` for bulk deletion by time
- \`TRUNCATE TABLE\` for full table cleanup
- Check for orphaned data: detached parts, temporary files
- System tables can grow large — set TTL on query_log, trace_log, etc.
- Load the \`troubleshooting\` skill for disk-full recovery procedures.`,
  },
  {
    name: 'clickhouse-best-practices',
    description:
      'Production operational practices: insert batching, async writes, query cache, connection pooling, and recommended settings.',
    content: `# ClickHouse Best Practices

## Insert Best Practices

- Batch 10k-100k rows per insert; max 1-2 inserts/sec per table
- Sub-1k-row inserts cause part proliferation; insert in sorting-key order to reduce merge work
- For bulk loads, tune \`min_insert_block_size_rows\` / \`max_insert_block_size_rows\`

## Async Inserts

- \`SET async_insert = 1; SET wait_for_async_insert = 1;\` (1=durable, 0=fire-and-forget)
- Tune \`async_insert_max_data_size\` (1M) and \`async_insert_busy_timeout_ms\` (10s) for batch window

## Query Cache (v23.5+)

- \`SET allow_experimental_query_cache = 1; SET use_query_cache = 1;\`
- TTL: \`query_cache_ttl\`; share across users: \`query_cache_shared_between_users = 1\`
- Control: \`enable_writes_to_query_cache\`, \`enable_reads_from_query_cache\`

## Connection Pooling

- HTTP: set \`pool_size\`, \`max_queries\`; keep-alive is critical
- TCP: built-in multiplexing; tune \`max_connections\`
- Monitor \`system.metrics\` for \`HTTPConnection\`/\`TCPConnection\` to size pools

## Production Settings

- \`max_threads\` — lower for concurrent loads; \`max_insert_threads\` — raise for parallel inserts
- \`max_execution_time\` / \`max_memory_usage\` — per-query limits
- \`join_algorithm\` — prefer \`grace_hash\` or \`auto\` for large joins
- \`input_format_allow_errors_num\` / \`ratio\` — tolerate parse errors in bulk imports

## Query Patterns

- \`COLUMNS('pattern')\` — regex column selection; \`APPLY func\` transforms matches
- \`clusterAllReplicas('cluster')\` — aggregate across all replicas
- \`FINAL\` — force merge for ReplacingMergeTree; use sparingly (full scan)`,
  },
]

/** Get all available skills metadata (without content) */
export function getSkillsMetadata(): ReadonlyArray<{
  name: string
  description: string
}> {
  return SKILLS.map(({ name, description }) => ({
    name,
    description,
  }))
}

/** Load a skill by name, returns null if not found */
export function loadSkillContent(name: string): Skill | null {
  return SKILLS.find((s) => s.name === name) ?? null
}
