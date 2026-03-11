/**
 * ClickHouse Schema Registry for AI Agent
 *
 * This module provides structured schema information about ClickHouse system tables
 * to help the LLM generate accurate SQL queries. It includes table definitions,
 * column descriptions, and example queries for common monitoring scenarios.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Schema Design Principles
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 1. Minimal but complete - Include essential columns for monitoring
 * 2. Type information - Help LLM understand data types for proper queries
 * 3. Contextual descriptions - Explain what each column represents
 * 4. Version awareness - Note columns that require specific ClickHouse versions
 * 5. Query patterns - Show common filtering and aggregation patterns
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Column definition in a table schema
 */
export interface SchemaColumn {
  /** Column name */
  readonly name: string
  /** ClickHouse data type */
  readonly type: string
  /** Human-readable description of what this column contains */
  readonly description: string
  /** Whether this column is nullable */
  readonly nullable?: boolean
  /** Minimum ClickHouse version for this column (if version-specific) */
  readonly since?: string
  /** Example values or common patterns */
  readonly examples?: readonly string[]
}

/**
 * Index definition for a table
 */
export interface SchemaIndex {
  /** Index name */
  readonly name: string
  /** Index type (e.g., minmax, set, bloom_filter) */
  readonly type: string
  /** Columns included in the index */
  readonly columns: readonly string[]
  /** Purpose of the index */
  readonly description?: string
}

/**
 * Table schema definition
 */
export interface TableSchema {
  /** Full table name including database (e.g., system.query_log) */
  readonly name: string
  /** Human-readable description of the table's purpose */
  readonly description: string
  /** Column definitions */
  readonly columns: readonly SchemaColumn[]
  /** Common query patterns for this table */
  readonly queryPatterns?: readonly string[]
  /** Example queries */
  readonly examples?: readonly {
    readonly description: string
    readonly sql: string
  }[]
  /** Important notes about querying this table */
  readonly notes?: readonly string[]
  /** Minimum ClickHouse version for this table */
  readonly since?: string
  /** Whether this table is optional (may not exist in all setups) */
  readonly optional?: boolean
}

/**
 * Schema registry containing all known ClickHouse system tables
 */
export interface SchemaRegistry {
  /** All registered table schemas */
  readonly tables: Readonly<Record<string, TableSchema>>
  /** Get schema for a specific table */
  getTable(table: string): TableSchema | undefined
  /** Get all tables matching a pattern */
  findTables(pattern: string): readonly TableSchema[]
  /** Get tables by category (queries, merges, tables, etc.) */
  getByCategory(category: SchemaCategory): readonly TableSchema[]
}

/** Schema categories for organizing tables */
export type SchemaCategory =
  | 'queries'
  | 'merges'
  | 'tables'
  | 'system'
  | 'replication'
  | 'clusters'
  | 'logging'
  | 'security'
  | 'all'

/**
 * Query log table schema - Historical query execution data
 */
export const QUERY_LOG_SCHEMA: TableSchema = {
  name: 'system.query_log',
  description:
    'Contains information about executed queries such as query text, start time, duration, and memory usage. Configurable via query_log system table.',
  columns: [
    {
      name: 'type',
      type: 'Enum8',
      description:
        'Event type. Values: QueryStart (1), QueryFinish (2), ExceptionBeforeStart (3), ExceptionWhileProcessing (4)',
      examples: ['QueryFinish', 'QueryStart'],
    },
    {
      name: 'event_date',
      type: 'Date',
      description: 'Query execution date',
    },
    {
      name: 'event_time',
      type: 'DateTime',
      description: 'Query execution timestamp',
    },
    {
      name: 'query_start_time',
      type: 'DateTime',
      description: 'Query start time',
    },
    {
      name: 'query_duration_ms',
      type: 'UInt64',
      description: 'Query duration in milliseconds',
    },
    {
      name: 'query',
      type: 'String',
      description: 'Query text (may be truncated)',
    },
    {
      name: 'user',
      type: 'String',
      description: 'User who executed the query',
    },
    {
      name: 'query_id',
      type: 'String',
      description: 'Query identifier',
    },
    {
      name: 'read_rows',
      type: 'UInt64',
      description: 'Number of rows read from tables',
    },
    {
      name: 'read_bytes',
      type: 'UInt64',
      description: 'Number of bytes read from tables',
    },
    {
      name: 'written_rows',
      type: 'UInt64',
      description: 'Number of rows written to tables',
    },
    {
      name: 'written_bytes',
      type: 'UInt64',
      description: 'Number of bytes written to tables',
    },
    {
      name: 'memory_usage',
      type: 'Int64',
      description: 'Memory consumption in bytes',
    },
    {
      name: 'exception_code',
      type: 'Int32',
      description: 'Exception code',
      nullable: true,
    },
    {
      name: 'exception_text',
      type: 'String',
      description: 'Exception message',
      nullable: true,
    },
    {
      name: 'stack_trace',
      type: 'String',
      description: 'Stack trace at the time of query execution',
      nullable: true,
    },
    {
      name: 'query_cache_usage',
      type: 'Enum8',
      description:
        'Query cache usage type. Values: None (0), Hit (1), Miss (2), Disabled (3)',
      since: '24.1',
      examples: ['Hit', 'Miss', 'None'],
    },
  ],
  queryPatterns: [
    "WHERE type = 'QueryFinish' - Filter only completed queries",
    'WHERE event_time >= now() - INTERVAL 24 HOUR - Time-based filtering',
    'ORDER BY query_duration_ms DESC - Sort by slowest queries',
    "WHERE exception_text != '' - Find failed queries",
  ],
  examples: [
    {
      description: 'Get the 10 slowest queries from the last hour',
      sql: "SELECT query, query_duration_ms, read_rows, formatReadableSize(read_bytes) AS bytes, user FROM system.query_log WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL 1 HOUR ORDER BY query_duration_ms DESC LIMIT 10",
    },
    {
      description: 'Count queries by user over the last 24 hours',
      sql: "SELECT user, count() AS query_count FROM system.query_log WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL 24 HOUR GROUP BY user ORDER BY query_count DESC",
    },
    {
      description: 'Find failed queries in the last hour',
      sql: "SELECT query, exception_text, user, event_time FROM system.query_log WHERE type != 'QueryStart' AND exception_text != '' AND event_time >= now() - INTERVAL 1 HOUR ORDER BY event_time DESC LIMIT 10",
    },
  ],
  notes: [
    'This table can grow very large - always filter by time range',
    'The query field may be truncated for very long queries',
    'Configure retention via query_log engine parameters',
  ],
}

/**
 * Processes table schema - Currently running queries
 */
export const PROCESSES_SCHEMA: TableSchema = {
  name: 'system.processes',
  description:
    'Contains information about currently running queries. Shows real-time query execution status.',
  columns: [
    {
      name: 'user',
      type: 'String',
      description: 'User who executed the query',
    },
    {
      name: 'query_id',
      type: 'String',
      description: 'Query identifier',
    },
    {
      name: 'query',
      type: 'String',
      description: 'Query text',
    },
    {
      name: 'elapsed',
      type: 'Float64',
      description: 'Time elapsed since query started (in seconds)',
    },
    {
      name: 'query_start_time',
      type: 'DateTime',
      description: 'Query start timestamp',
    },
    {
      name: 'memory_usage',
      type: 'Int64',
      description: 'Memory consumption in bytes',
    },
    {
      name: 'read_rows',
      type: 'UInt64',
      description: 'Number of rows read',
    },
    {
      name: 'read_bytes',
      type: 'UInt64',
      description: 'Number of bytes read',
    },
    {
      name: 'total_rows',
      type: 'UInt64',
      description: 'Estimated total rows to read',
    },
    {
      name: 'thread_ids',
      type: 'Array(UInt64)',
      description: 'Thread IDs executing the query',
    },
  ],
  queryPatterns: [
    'Shows only currently running queries (no history)',
    'Data disappears when query completes',
    'Use for real-time monitoring only',
  ],
  examples: [
    {
      description: 'Show all currently running queries',
      sql: 'SELECT query, user, elapsed, formatReadableSize(memory_usage) AS memory, formatReadableQuantity(read_rows) AS rows_read FROM system.processes ORDER BY elapsed DESC',
    },
    {
      description: 'Find long-running queries (> 5 minutes)',
      sql: 'SELECT query, user, elapsed, query_id FROM system.processes WHERE elapsed > 300 ORDER BY elapsed DESC',
    },
  ],
  notes: [
    'This is a view, not a physical table',
    'Data is only available while queries are running',
    'Use query_log for historical data',
  ],
}

/**
 * Merges table schema - Active merge operations
 */
export const MERGES_SCHEMA: TableSchema = {
  name: 'system.merges',
  description:
    'Contains information about currently running or completed merge and mutation operations in MergeTree tables.',
  columns: [
    {
      name: 'database',
      type: 'String',
      description: 'Database name',
    },
    {
      name: 'table',
      type: 'String',
      description: 'Table name',
    },
    {
      name: 'elapsed',
      type: 'Float64',
      description: 'Time elapsed since merge started (seconds)',
    },
    {
      name: 'progress',
      type: 'Float64',
      description: 'Merge progress (0-1)',
    },
    {
      name: 'num_parts',
      type: 'UInt64',
      description: 'Number of parts to merge',
    },
    {
      name: 'rows_read',
      type: 'UInt64',
      description: 'Number of rows read',
    },
    {
      name: 'bytes_read_uncompressed',
      type: 'UInt64',
      description: 'Number of uncompressed bytes read',
    },
    {
      name: 'rows_written',
      type: 'UInt64',
      description: 'Number of rows written',
    },
    {
      name: 'bytes_written_uncompressed',
      type: 'UInt64',
      description: 'Number of uncompressed bytes written',
    },
    {
      name: 'memory_usage',
      type: 'Int64',
      description: 'Memory usage in bytes',
    },
    {
      name: 'is_mutation',
      type: 'UInt8',
      description: 'Whether this is a mutation operation (1) or merge (0)',
    },
    {
      name: 'mutation_id',
      type: 'String',
      description: 'Mutation identifier (for mutations)',
      nullable: true,
    },
  ],
  queryPatterns: [
    'Shows only active merges (no history)',
    'Use part_log for historical merge data',
    'Large merges may affect query performance',
  ],
  examples: [
    {
      description: 'Show all active merges with progress',
      sql: 'SELECT database, table, elapsed, progress, formatReadableQuantity(num_parts) AS parts, formatReadableSize(bytes_written_uncompressed) AS size FROM system.merges ORDER BY elapsed DESC',
    },
    {
      description: 'Find merges that have been running for over an hour',
      sql: 'SELECT database, table, elapsed, num_parts, rows_read FROM system.merges WHERE elapsed > 3600 ORDER BY elapsed DESC',
    },
  ],
  notes: [
    'This is a view, data only exists for active merges',
    'Use system.part_log for merge history',
  ],
}

/**
 * Parts table schema - Table partition information
 */
export const PARTS_SCHEMA: TableSchema = {
  name: 'system.parts',
  description:
    'Contains information about data parts of MergeTree tables. Shows table storage structure and metadata.',
  columns: [
    {
      name: 'database',
      type: 'String',
      description: 'Database name',
    },
    {
      name: 'table',
      type: 'String',
      description: 'Table name',
    },
    {
      name: 'name',
      type: 'String',
      description: 'Part name',
    },
    {
      name: 'partition',
      type: 'String',
      description: 'Partition ID or name',
    },
    {
      name: 'active',
      type: 'UInt8',
      description: 'Is the part active (in use)',
    },
    {
      name: 'rows',
      type: 'UInt64',
      description: 'Number of rows in the part',
    },
    {
      name: 'bytes_on_disk',
      type: 'UInt64',
      description: 'Disk size in bytes',
    },
    {
      name: 'marks',
      type: 'UInt64',
      description: 'Number of marks',
    },
    {
      name: 'modification_time',
      type: 'DateTime',
      description: 'Time when part was created or modified',
    },
    {
      name: 'remove_time',
      type: 'DateTime',
      description: 'Time when part will be removed',
      nullable: true,
    },
    {
      name: 'engine',
      type: 'String',
      description: 'Table engine name',
    },
  ],
  queryPatterns: [
    'WHERE active = 1 - Filter only active parts',
    'GROUP BY database, table - Aggregate by table',
    'ORDER BY bytes_on_disk DESC - Find largest tables',
  ],
  examples: [
    {
      description: 'Get total size and row count per table',
      sql: 'SELECT database, table, sum(rows) AS total_rows, sum(bytes_on_disk) AS total_bytes, formatReadableSize(sum(bytes_on_disk)) AS readable_size FROM system.parts WHERE active GROUP BY database, table ORDER BY total_bytes DESC',
    },
    {
      description: 'Find largest individual parts',
      sql: 'SELECT database, table, partition, name, formatReadableSize(bytes_on_disk) AS size, rows FROM system.parts WHERE active ORDER BY bytes_on_disk DESC LIMIT 20',
    },
    {
      description: 'Count parts per table',
      sql: 'SELECT database, table, count() AS part_count, formatReadableSize(sum(bytes_on_disk)) AS total_size FROM system.parts WHERE active GROUP BY database, table ORDER BY part_count DESC',
    },
  ],
  notes: [
    'Includes both active and inactive parts',
    'Filter by active = 1 for current data',
    'Large numbers of parts may indicate merge issues',
  ],
}

/**
 * Tables table schema - Table metadata
 */
export const TABLES_SCHEMA: TableSchema = {
  name: 'system.tables',
  description:
    'Contains metadata about all tables in the database including engine, partition key, and sorting key.',
  columns: [
    {
      name: 'database',
      type: 'String',
      description: 'Database name',
    },
    {
      name: 'name',
      type: 'String',
      description: 'Table name',
    },
    {
      name: 'engine',
      type: 'String',
      description: 'Table engine (e.g., MergeTree, Log, Memory)',
    },
    {
      name: 'total_rows',
      type: 'UInt64',
      description: 'Estimated total rows',
      nullable: true,
    },
    {
      name: 'total_bytes',
      type: 'UInt64',
      description: 'Estimated total bytes on disk',
      nullable: true,
    },
    {
      name: 'partition_key',
      type: 'String',
      description: 'Partition key expression',
      nullable: true,
    },
    {
      name: 'sorting_key',
      type: 'String',
      description: 'Sorting key expression',
      nullable: true,
    },
    {
      name: 'primary_key',
      type: 'String',
      description: 'Primary key expression',
      nullable: true,
    },
    {
      name: 'create_table_query',
      type: 'String',
      description: 'CREATE TABLE statement',
    },
  ],
  queryPatterns: [
    'GROUP BY engine - Count tables by engine type',
    'ORDER BY total_bytes DESC - Find largest tables',
    "WHERE engine = 'MergeTree' - Filter by engine",
  ],
  examples: [
    {
      description: 'List all tables with their sizes',
      sql: 'SELECT database, name, engine, formatReadableSize(total_bytes) AS size, formatReadableQuantity(total_rows) AS rows FROM system.tables ORDER BY total_bytes DESC',
    },
    {
      description: 'Count tables by engine',
      sql: 'SELECT engine, count() AS table_count FROM system.tables GROUP BY engine ORDER BY table_count DESC',
    },
    {
      description: 'Find MergeTree tables without partition key',
      sql: "SELECT database, name FROM system.tables WHERE engine LIKE '%MergeTree' AND (partition_key = '' OR partition_key IS NULL)",
    },
  ],
  notes: [
    'total_rows and total_bytes are estimates (updated asynchronously)',
    'Includes temporary and system tables',
  ],
}

/**
 * Databases table schema
 */
export const DATABASES_SCHEMA: TableSchema = {
  name: 'system.databases',
  description: 'Contains information about databases registered in the server.',
  columns: [
    {
      name: 'name',
      type: 'String',
      description: 'Database name',
    },
    {
      name: 'engine',
      type: 'String',
      description: 'Database engine',
      nullable: true,
    },
    {
      name: 'data_path',
      type: 'String',
      description: 'File system path to database data',
      nullable: true,
    },
    {
      name: 'metadata_path',
      type: 'String',
      description: 'File system path to database metadata',
      nullable: true,
    },
  ],
  examples: [
    {
      description: 'List all databases',
      sql: 'SELECT name, engine FROM system.databases ORDER BY name',
    },
  ],
}

/**
 * Part log table schema - Merge/part operation history
 */
export const PART_LOG_SCHEMA: TableSchema = {
  name: 'system.part_log',
  description:
    'Contains information about events that occurred with data parts in MergeTree tables (merges, mutations).',
  columns: [
    {
      name: 'event_type',
      type: 'Enum8',
      description:
        'Event type: NewPart (1), MergeParts (2), DownloadPart (3), RemovePart (4), MutatePart (5), MutatePartStart (6), MergePartsStart (8)',
      examples: ['MergeParts', 'RemovePart', 'NewPart'],
    },
    {
      name: 'event_date',
      type: 'Date',
      description: 'Event date',
    },
    {
      name: 'event_time',
      type: 'DateTime',
      description: 'Event timestamp',
    },
    {
      name: 'database',
      type: 'String',
      description: 'Database name',
    },
    {
      name: 'table',
      type: 'String',
      description: 'Table name',
    },
    {
      name: 'part_name',
      type: 'String',
      description: 'Part name',
    },
    {
      name: 'duration_ms',
      type: 'UInt64',
      description: 'Event duration in milliseconds',
    },
    {
      name: 'size_in_bytes',
      type: 'UInt64',
      description: 'Part size in bytes',
    },
    {
      name: 'rows',
      type: 'UInt64',
      description: 'Number of rows',
    },
  ],
  queryPatterns: [
    'WHERE event_type = 2 - Filter for merge events only',
    'WHERE event_time >= now() - INTERVAL 24 HOUR - Time filter',
    'ORDER BY duration_ms DESC - Find longest operations',
  ],
  examples: [
    {
      description: 'Show recent merge operations with duration',
      sql: 'SELECT event_time, database, table, part_name, duration_ms / 1000 AS duration_sec, formatReadableSize(size_in_bytes) AS size FROM system.part_log WHERE event_type = 2 ORDER BY event_time DESC LIMIT 20',
    },
    {
      description: 'Find slow merges from the last 24 hours',
      sql: 'SELECT event_time, database, table, duration_ms / 1000 AS seconds, rows FROM system.part_log WHERE event_type = 2 AND event_time >= now() - INTERVAL 24 HOUR ORDER BY duration_ms DESC LIMIT 10',
    },
  ],
  notes: [
    'This table is optional - requires part_log server configuration',
    'Provides historical data for merge operations',
  ],
  optional: true,
}

/**
 * Clusters table schema
 */
export const CLUSTERS_SCHEMA: TableSchema = {
  name: 'system.clusters',
  description:
    'Contains information about clusters available in the ClickHouse server configuration.',
  columns: [
    {
      name: 'cluster',
      type: 'String',
      description: 'Cluster name',
    },
    {
      name: 'shard_num',
      type: 'UInt32',
      description: 'Shard number in the cluster',
    },
    {
      name: 'replica_num',
      type: 'UInt32',
      description: 'Replica number in the shard',
    },
    {
      name: 'host_name',
      type: 'String',
      description: 'Host name',
    },
    {
      name: 'host_address',
      type: 'String',
      description: 'IP address',
    },
    {
      name: 'port',
      type: 'UInt16',
      description: 'Port to connect to',
    },
    {
      name: 'user',
      type: 'String',
      description: 'User name',
    },
    {
      name: 'errors_count',
      type: 'UInt32',
      description: 'Number of times this replica failed',
    },
    {
      name: 'slowdowns_count',
      type: 'UInt32',
      description: 'Number of slowdowns',
    },
  ],
  examples: [
    {
      description: 'List all cluster replicas',
      sql: 'SELECT cluster, shard_num, replica_num, host_name, port FROM system.clusters ORDER BY cluster, shard_num, replica_num',
    },
    {
      description: 'Find replicas with errors',
      sql: 'SELECT cluster, host_name, errors_count, slowdowns_count FROM system.clusters WHERE errors_count > 0 OR slowdowns_count > 0',
    },
  ],
}

/**
 * Metrics table schema
 */
export const METRICS_SCHEMA: TableSchema = {
  name: 'system.metrics',
  description:
    'Contains metrics which are instantaneously calculated on a read request.',
  columns: [
    {
      name: 'metric',
      type: 'String',
      description: 'Metric name',
    },
    {
      name: 'value',
      type: 'Int64',
      description: 'Metric value',
    },
    {
      name: 'description',
      type: 'String',
      description: 'Metric description',
    },
  ],
  examples: [
    {
      description: 'Show all current metrics',
      sql: 'SELECT metric, value, description FROM system.metrics WHERE value > 0 ORDER BY metric',
    },
    {
      description: 'Get connection count',
      sql: "SELECT value FROM system.metrics WHERE metric = 'HTTPConnection' OR metric = 'TCPConnection'",
    },
  ],
}

/**
 * Asynchronous metrics table schema
 */
export const ASYNC_METRICS_SCHEMA: TableSchema = {
  name: 'system.asynchronous_metrics',
  description:
    'Contains metrics that are periodically calculated in the background.',
  columns: [
    {
      name: 'metric',
      type: 'String',
      description: 'Metric name',
    },
    {
      name: 'value',
      type: 'Float64',
      description: 'Metric value',
    },
  ],
  examples: [
    {
      description: 'Get memory usage',
      sql: "SELECT metric, formatReadableSize(value) AS size FROM system.asynchronous_metrics WHERE metric IN ('OSMemoryTotal', 'OSMemoryFree', 'MemoryTracking')",
    },
  ],
}

/**
 * Replicas table schema
 */
export const REPLICAS_SCHEMA: TableSchema = {
  name: 'system.replicas',
  description: 'Contains information and status for replicated tables.',
  columns: [
    {
      name: 'database',
      type: 'String',
      description: 'Database name',
    },
    {
      name: 'table',
      type: 'String',
      description: 'Table name',
    },
    {
      name: 'engine',
      type: 'String',
      description: 'Table engine name',
    },
    {
      name: 'is_leader',
      type: 'UInt8',
      description: 'Is this replica the leader',
    },
    {
      name: 'is_readonly',
      type: 'UInt8',
      description: 'Is replica in read-only mode',
    },
    {
      name: 'is_session_expired',
      type: 'UInt8',
      description: 'Is ZooKeeper session expired',
    },
    {
      name: 'queue_size',
      type: 'UInt32',
      description: 'Number of operations waiting in queue',
    },
    {
      name: 'absolute_delay',
      type: 'UInt64',
      description: 'Delay in milliseconds from leader',
    },
    {
      name: 'zookeeper_path',
      type: 'String',
      description: 'ZooKeeper path for the table',
    },
  ],
  examples: [
    {
      description: 'Find replicas with queue or delay',
      sql: 'SELECT database, table, queue_size, absolute_delay, is_leader FROM system.replicas WHERE queue_size > 0 OR absolute_delay > 0',
    },
    {
      description: 'Find read-only replicas',
      sql: 'SELECT database, table, is_readonly, is_session_expired FROM system.replicas WHERE is_readonly = 1',
    },
  ],
  notes: ['Only applies to ReplicatedMergeTree engines'],
}

/**
 * ZooKeeper table schema
 */
export const ZOOKEEPER_SCHEMA: TableSchema = {
  name: 'system.zookeeper',
  description:
    'Allows reading data from ZooKeeper/Keeper that ClickHouse is using. Returns path and value data.',
  columns: [
    {
      name: 'name',
      type: 'String',
      description: 'Node name',
    },
    {
      name: 'path',
      type: 'String',
      description: 'Full node path',
    },
    {
      name: 'value',
      type: 'String',
      description: 'Node value',
      nullable: true,
    },
    {
      name: 'data_version',
      type: 'Int32',
      description: 'Data version',
    },
    {
      name: 'ctime',
      type: 'DateTime',
      description: 'Creation time',
    },
    {
      name: 'mtime',
      type: 'DateTime',
      description: 'Modification time',
    },
    {
      name: 'num_children',
      type: 'Int32',
      description: 'Number of child nodes',
    },
  ],
  examples: [
    {
      description: 'Browse ZooKeeper root',
      sql: "SELECT name, num_children FROM system.zookeeper WHERE path = '/'",
    },
    {
      description: 'Get Keeper queues for replication',
      sql: "SELECT name, value FROM system.zookeeper WHERE path = '/clickhouse/tables'",
    },
  ],
  notes: [
    'Only available if ZooKeeper/Keeper is configured',
    'Optional table - not in all ClickHouse deployments',
  ],
  optional: true,
}

/**
 * All table schemas organized by name
 */
const TABLE_SCHEMAS: Readonly<Record<string, TableSchema>> = {
  'system.query_log': QUERY_LOG_SCHEMA,
  'system.processes': PROCESSES_SCHEMA,
  'system.merges': MERGES_SCHEMA,
  'system.parts': PARTS_SCHEMA,
  'system.tables': TABLES_SCHEMA,
  'system.databases': DATABASES_SCHEMA,
  'system.part_log': PART_LOG_SCHEMA,
  'system.clusters': CLUSTERS_SCHEMA,
  'system.metrics': METRICS_SCHEMA,
  'system.asynchronous_metrics': ASYNC_METRICS_SCHEMA,
  'system.replicas': REPLICAS_SCHEMA,
  'system.zookeeper': ZOOKEEPER_SCHEMA,
} as const

/**
 * Schema categories for organizing tables
 */
const SCHEMA_CATEGORIES: Readonly<Record<SchemaCategory, readonly string[]>> = {
  queries: ['system.query_log', 'system.processes'],
  merges: ['system.merges', 'system.part_log'],
  tables: ['system.tables', 'system.parts', 'system.databases'],
  system: ['system.metrics', 'system.asynchronous_metrics', 'system.clusters'],
  replication: ['system.replicas'],
  clusters: ['system.clusters'],
  logging: [],
  security: [],
  all: Object.keys(TABLE_SCHEMAS),
} as const

/**
 * Format schema information for LLM context
 * Returns a structured string describing available tables and their columns
 */
export function formatSchemaForLLM(tables?: readonly string[]): string {
  const schemas = tables
    ? tables.map((t) => TABLE_SCHEMAS[t]).filter(Boolean)
    : Object.values(TABLE_SCHEMAS)

  if (schemas.length === 0) {
    return 'No schema information available.'
  }

  let output = 'Available ClickHouse System Tables:\n\n'

  for (const schema of schemas) {
    output += `### ${schema.name}\n`
    output += `${schema.description}\n\n`

    if (schema.columns.length > 0) {
      output += '**Columns:**\n'
      for (const col of schema.columns.slice(0, 20)) {
        // Limit columns for context size
        output += `- \`${col.name}\` (${col.type}): ${col.description}\n`
      }
      if (schema.columns.length > 20) {
        output += `... and ${schema.columns.length - 20} more columns\n`
      }
      output += '\n'
    }

    if (schema.queryPatterns && schema.queryPatterns.length > 0) {
      output += '**Common Patterns:**\n'
      for (const pattern of schema.queryPatterns) {
        output += `- ${pattern}\n`
      }
      output += '\n'
    }
  }

  return output
}

/**
 * Get a specific table schema
 */
export function getTableSchema(table: string): TableSchema | undefined {
  return TABLE_SCHEMAS[table]
}

/**
 * Find tables matching a pattern
 */
export function findTables(pattern: string): readonly TableSchema[] {
  const regex = new RegExp(pattern, 'i')
  return Object.values(TABLE_SCHEMAS).filter((s) => regex.test(s.name))
}

/**
 * Get tables by category
 */
export function getTablesByCategory(
  category: SchemaCategory
): readonly TableSchema[] {
  const tableNames = SCHEMA_CATEGORIES[category] ?? []
  return tableNames.map((name) => TABLE_SCHEMAS[name]).filter(Boolean)
}

/**
 * Main schema registry instance
 */
export const schemaRegistry: SchemaRegistry = {
  tables: TABLE_SCHEMAS,
  getTable: getTableSchema,
  findTables,
  getByCategory: getTablesByCategory,
} as const

/**
 * Quick reference for common query templates
 * These can be used as starting points for LLM-generated queries
 */
export const QUERY_TEMPLATES = {
  slowestQueries: {
    description: 'Get the N slowest completed queries',
    template:
      "SELECT query, query_duration_ms / 1000 AS duration_sec, user, formatReadableSize(read_bytes) AS bytes, formatReadableQuantity(read_rows) AS rows FROM system.query_log WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL {hours} HOUR ORDER BY query_duration_ms DESC LIMIT {limit}",
  },
  queryStats: {
    description: 'Aggregate query statistics over time',
    template:
      "SELECT toStartOfInterval(event_time, INTERVAL {minutes} MINUTE) AS time, count() AS queries, avg(query_duration_ms) AS avg_duration, sum(read_bytes) AS total_read FROM system.query_log WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL {hours} HOUR GROUP BY time ORDER BY time",
  },
  tableSizes: {
    description: 'Get all tables with their sizes',
    template:
      'SELECT database, table, sum(rows) AS total_rows, sum(bytes_on_disk) AS total_bytes, formatReadableSize(sum(bytes_on_disk)) AS readable_size FROM system.parts WHERE active GROUP BY database, table ORDER BY total_bytes DESC LIMIT {limit}',
  },
  activeMerges: {
    description: 'Show currently running merge operations',
    template:
      'SELECT database, table, elapsed, progress, formatReadableSize(bytes_written_uncompressed) AS size, num_parts FROM system.merges ORDER BY elapsed DESC',
  },
  failedQueries: {
    description: 'Get recent failed queries',
    template:
      "SELECT query, exception_text, user, event_time FROM system.query_log WHERE type != 'QueryStart' AND exception_text != '' AND event_time >= now() - INTERVAL {hours} HOUR ORDER BY event_time DESC LIMIT {limit}",
  },
} as const
