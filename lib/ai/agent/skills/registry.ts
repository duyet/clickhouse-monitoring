/**
 * Auto-generated skills registry.
 * Run `bun run build:skills` to regenerate from .agents/skills/
 *
 * DO NOT EDIT MANUALLY
 */

import type { Skill } from './types'

const SKILLS: readonly Skill[] = [
  {
    name: 'replication-guide',
    description:
      '"ReplicatedMergeTree operations, failover procedures, lag diagnosis, quorum writes, and Keeper management."',
    content: `# Replication Guide

## When to use this skill
Load when users ask about replication setup, lag, failover, or Keeper/ZooKeeper.

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
- **Diverged replicas**: \`SYSTEM SYNC REPLICA db.table\` to force sync`,
  },
  {
    name: 'query-optimization',
    description:
      '"Query optimization strategies: PREWHERE, JOIN patterns, materialized views, EXPLAIN analysis, index usage, and query profiling."',
    content: `# Query Optimization

## When to use this skill
Load when users ask about slow queries, optimization strategies, or query performance tuning.

## PREWHERE Optimization
- PREWHERE filters rows before reading all columns (MergeTree only)
- ClickHouse auto-promotes simple WHERE conditions to PREWHERE
- Manually use PREWHERE for complex conditions on indexed columns
- Best when filtering on columns NOT in the SELECT list

## JOIN Strategies
- Put smaller table on RIGHT side of JOIN
- Use \`IN\` subquery for simple lookups instead of JOIN
- Filter both sides before joining to reduce intermediate data
- \`GLOBAL JOIN\` for distributed queries — broadcasts small table to all shards
- \`JOIN ... USING\` is cleaner than \`ON\` for same-name columns
- Consider \`join_algorithm\` setting: hash (default), partial_merge, auto

## Materialized Views
- Incremental aggregation: \`CREATE MATERIALIZED VIEW mv TO target AS SELECT ... FROM source\`
- Pre-compute expensive aggregations (counts, sums, uniq)
- Use AggregatingMergeTree for complex aggregate states
- Pattern: raw events → materialized view → aggregated table
- Multiple MVs on same source table for different query patterns

## EXPLAIN Analysis
- \`EXPLAIN PLAN\` — logical query plan, shows transformations
- \`EXPLAIN PIPELINE\` — physical execution pipeline with parallelism
- \`EXPLAIN INDEXES\` — which indexes are used, granules selected
- Look for: full table scans, excessive granule reads, missing index usage
- Compare \`read_rows\` vs \`result_rows\` in query_log for scan efficiency

## Index Usage
- Primary index: columns in ORDER BY, checked first
- Skip indexes: \`minmax\`, \`set\`, \`bloom_filter\`, \`tokenbf_v1\`
- \`minmax\` — range queries on numeric/date columns
- \`bloom_filter\` — equality checks on high-cardinality strings
- \`set(N)\` — stores N unique values per granule, good for low-cardinality
- Check index effectiveness: \`system.query_log\` ProfileEvents

## Query Profiling
- \`system.query_log\` with \`type = 'QueryFinish'\` for completed queries
- Key columns: \`query_duration_ms\`, \`read_rows\`, \`read_bytes\`, \`memory_usage\`
- \`ProfileEvents\` map contains detailed counters (SelectedRows, MergedRows, etc.)
- Use \`normalized_query_hash\` to group similar queries
- Compare \`read_rows\` / \`result_rows\` ratio — high ratio = inefficient scan

## Common Anti-Patterns
- \`SELECT *\` — reads all columns, wastes I/O
- Missing LIMIT on exploratory queries
- JOINing large tables without pre-filtering
- Using \`FINAL\` without understanding the cost (full merge on read)
- Sorting by non-indexed columns on large result sets`,
  },
  {
    name: 'cluster-operations',
    description:
      '"Distributed table management, resharding, node addition/removal, and cluster topology operations."',
    content: `# Cluster Operations

## When to use this skill
Load when users ask about cluster management, distributed tables, or scaling.

## Distributed Tables
- \`CREATE TABLE dist ENGINE = Distributed(cluster, db, local_table, sharding_key)\`
- Sharding key: \`rand()\` for even distribution, \`cityHash64(user_id)\` for user affinity
- Reads: query all shards in parallel
- Writes: can route to correct shard or write locally

## Adding Nodes
1. Install ClickHouse on new node
2. Configure Keeper/ZooKeeper connection
3. Update cluster config (\`remote_servers\`) on all nodes
4. Create local tables on new node
5. For ReplicatedMergeTree: data syncs automatically
6. For non-replicated: manually copy data or re-insert

## Removing Nodes
1. Stop writes to the node
2. Wait for replication queue to drain
3. \`SYSTEM DROP REPLICA\` for replicated tables
4. Remove from cluster config
5. Restart remaining nodes to pick up config

## Resharding
- ClickHouse doesn't support online resharding natively
- Strategy: create new distributed table with new sharding scheme
- Use \`INSERT INTO new_dist SELECT * FROM old_dist\` to migrate
- Or use \`clickhouse-copier\` for large-scale migrations

## Monitoring Clusters
- \`system.clusters\` — topology view
- \`system.distributed_ddl_queue\` — DDL operation status
- \`system.replicas\` — per-table replication status
- Cross-shard queries: use Distributed table or \`remote()\` function`,
  },
  {
    name: 'troubleshooting',
    description:
      '"Diagnose and resolve common ClickHouse issues: OOM, slow merges, replication lag, disk full, stuck mutations, and query failures."',
    content: `# Troubleshooting Guide

## When to use this skill
Load when users report errors, performance issues, or system problems.

## OOM (Out of Memory)
### Diagnosis
- Check \`system.query_log\` for queries with high \`memory_usage\`
- Look at \`system.processes\` for currently running memory-heavy queries
- \`system.metrics\` WHERE metric = 'MemoryTracking' for current usage

### Solutions
- Set \`max_memory_usage\` per query (e.g., 10GB)
- Set \`max_memory_usage_for_user\` to limit per-user consumption
- Use \`max_bytes_before_external_group_by\` for spill-to-disk
- Use \`max_bytes_before_external_sort\` for large sorts
- Reduce JOIN sizes with pre-filtering
- Use SAMPLE for approximate aggregations

## Slow Merges
### Diagnosis
- \`system.merges\` — check \`elapsed\`, \`progress\`, \`total_size_bytes_compressed\`
- \`system.part_log\` WHERE event_type = 'MergeParts' for historical throughput
- Too many parts: check \`max_parts_count_for_partition\` in \`system.asynchronous_metrics\`

### Solutions
- Increase \`background_pool_size\` (default: 16)
- Check disk I/O with \`system.asynchronous_metrics\` (ReadBufferFromFileDescriptorReadBytes)
- Reduce insert frequency (batch larger)
- Partition strategy: ensure not too many partitions
- \`OPTIMIZE TABLE ... FINAL\` to force merge (expensive, use off-peak)

## Replication Lag
### Diagnosis
- \`system.replicas\` — \`absolute_delay\`, \`queue_size\`, \`is_readonly\`
- \`system.replication_queue\` — pending tasks, \`num_tries\`, \`last_exception\`
- Network: check inter-server connectivity

### Solutions
- Check ZooKeeper/Keeper health and latency
- Increase \`background_fetches_pool_size\`
- Check for stuck entries in replication_queue
- If readonly: check ZooKeeper session, disk space
- \`SYSTEM RESTART REPLICA\` as last resort

## Disk Full
### Diagnosis
- \`system.disks\` — \`free_space\`, \`total_space\`
- \`system.parts\` — find largest tables/partitions
- Check for detached parts: \`system.detached_parts\`

### Solutions
- DROP old partitions: \`ALTER TABLE t DROP PARTITION 'YYYYMM'\`
- Set up TTL for automatic cleanup
- Move data to cold storage with tiered storage
- Clean detached parts: \`ALTER TABLE t DROP DETACHED PART 'name'\`
- Reduce replication factor if desperate

## Stuck Mutations
### Diagnosis
- \`system.mutations\` WHERE is_done = 0 — check \`parts_to_do\`, \`latest_fail_reason\`
- Mutations block new merges on affected parts

### Solutions
- \`KILL MUTATION WHERE mutation_id = '...'\` to cancel
- Fix the underlying issue (schema mismatch, disk space)
- Re-submit the mutation after fixing
- Consider using INSERT + ReplacingMergeTree instead of UPDATE mutations

## Query Failures
### Diagnosis
- \`system.query_log\` WHERE type = 'ExceptionWhileProcessing'
- Check \`exception_code\` and \`exception\` columns
- Common codes: 60 (table not found), 47 (unknown column), 241 (memory limit)

### Solutions
- Code 60: verify table exists, check database name
- Code 47: use \`get_table_schema\` to check column names
- Code 241: reduce query scope, add LIMIT, use SAMPLE
- Code 159: timeout — add time filters, use LIMIT
- Code 252: too many parts — wait for merges or optimize`,
  },
  {
    name: 'security-hardening',
    description:
      '"RBAC configuration, row policies, quotas, network security, audit logging, and access control best practices."',
    content: `# Security Hardening

## When to use this skill
Load when users ask about access control, security, auditing, or user management.

## RBAC (Role-Based Access Control)
- Create roles: \`CREATE ROLE analyst\`
- Grant permissions: \`GRANT SELECT ON db.* TO analyst\`
- Assign to users: \`GRANT analyst TO user1\`
- Hierarchical: roles can inherit from other roles
- Check grants: \`SHOW GRANTS FOR user1\`

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
      '"Schema migrations, ALTER patterns, engine changes, data backfill, and zero-downtime migration strategies."',
    content: `# Migration Patterns

## When to use this skill
Load when users ask about schema changes, migrations, or engine upgrades.

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

## Partition Operations
- \`ALTER TABLE t ATTACH PARTITION id FROM other_table\` — zero-copy if same structure
- \`ALTER TABLE t REPLACE PARTITION id FROM other_table\` — atomic swap
- \`ALTER TABLE t MOVE PARTITION id TO TABLE other_table\` — move data

## Common Pitfalls
- Nullable to non-Nullable requires default value for existing NULLs
- Changing ORDER BY requires table recreation
- Mutations (UPDATE/DELETE) rewrite all parts — schedule off-peak
- Test migrations on staging with production data volumes`,
  },
  {
    name: 'storage-optimization',
    description:
      '"Compression codecs, TTL policies, tiered storage, part management, and disk space optimization."',
    content: `# Storage Optimization

## When to use this skill
Load when users ask about disk usage, compression, TTL, or storage tiers.

## Compression Codecs
- Default: LZ4 — fast, moderate compression
- \`ZSTD(level)\` — better compression, slower. Level 1-22 (3 is good default)
- \`Delta\` + ZSTD — excellent for time-series monotonic data
- \`DoubleDelta\` — best for timestamps and counters
- \`Gorilla\` — optimized for floating-point gauge metrics
- \`T64\` — for integer columns with small range
- Per-column: \`ALTER TABLE t MODIFY COLUMN col TYPE UInt32 CODEC(Delta, ZSTD(3))\`

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
- Force merge: \`OPTIMIZE TABLE t FINAL\` (expensive)
- Detached parts: check \`system.detached_parts\`, clean with \`DROP DETACHED PART\`
- Part size target: 1-10GB per part for optimal performance

## Disk Space Recovery
- \`DROP PARTITION\` for bulk deletion by time
- \`TRUNCATE TABLE\` for full table cleanup
- Check for orphaned data: detached parts, temporary files
- System tables can grow large — set TTL on query_log, trace_log, etc.`,
  },
  {
    name: 'clickhouse-best-practices',
    description:
      'ClickHouse schema design, query optimization, and operational best practices for production deployments.',
    content: `# ClickHouse Best Practices

## When to use this skill
Load this skill when users ask about:
- Table engine selection and design
- Query optimization strategies
- Schema design best practices
- Partition and index strategies
- Performance tuning
- Data type selection
- Merge tree family best practices

## Schema Design

### Partition Key Selection
- Partition by month (\`toYYYYMM(event_time)\`) for most time-series data
- Keep partitions under 1000 per table
- Use partition for data lifecycle (TTL, DROP PARTITION)
- Never partition by high-cardinality columns

### Sorting Key Design
- Put most-filtered columns first in ORDER BY
- Time column usually goes last (for range scans within filtered data)
- Keep sorting key under 4-5 columns
- Example: \`ORDER BY (tenant_id, event_type, event_time)\`

### Primary Key
- Can be prefix of sorting key for larger granules
- Default: same as sorting key
- Shorter primary key = less memory for index

## Query Optimization

### Use PREWHERE
- Moves filter to before column reads
- Best for filtering on columns not in SELECT
- ClickHouse auto-promotes WHERE to PREWHERE for simple conditions

### Avoid SELECT *
- Column-oriented storage means each column = separate read
- Only select needed columns
- Use \`COLUMNS('pattern')\` for regex column selection

### SAMPLE for Large Tables
- \`SAMPLE 0.1\` reads ~10% of data randomly
- Good for approximate aggregations on huge tables
- Not suitable for exact counts or small result sets

### JOIN Best Practices
- Put smaller table on the RIGHT side of JOIN
- Use \`IN\` subquery instead of JOIN for simple lookups
- Filter both sides before joining
- Consider \`GLOBAL JOIN\` for distributed queries

## Data Type Best Practices

### Use LowCardinality
- For string columns with < 10,000 distinct values
- 5-10x compression improvement
- Faster GROUP BY and filtering

### Avoid Nullable When Possible
- Nullable adds 1 byte overhead per row
- Use default values (0, empty string) instead
- Nullable disables some optimizations

### DateTime Precision
- \`Date\` (2 bytes) for date-only fields
- \`DateTime\` (4 bytes) for second precision
- \`DateTime64(3)\` (8 bytes) only when milliseconds needed

## Operational Best Practices

### Monitoring Queries
- Check \`system.merges\` for background merge health
- Monitor \`system.mutations\` for stuck mutations
- Use \`system.query_log\` with \`type = 'QueryFinish'\` for performance analysis
- Watch \`system.replicas\` for replication lag

### TTL Management
- Set TTL at table level: \`TTL event_time + INTERVAL 90 DAY\`
- Use tiered storage: \`TTL ... TO VOLUME 'cold'\`
- Monitor TTL merges in \`system.merges\`

### Insert Best Practices
- Batch inserts: 10,000-100,000 rows per batch
- Avoid small frequent inserts (< 1000 rows)
- Use async inserts for high-frequency small writes
- Max 1-2 inserts per second per table`,
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
