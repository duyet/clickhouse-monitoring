import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

import { mergesConfig } from './merges/merges'
import { commonErrorsConfig } from './queries/common-errors'
import { expensiveQueriesConfig } from './queries/expensive-queries'
import { expensiveQueriesByMemoryConfig } from './queries/expensive-queries-by-memory'
import { failedQueriesConfig } from './queries/failed-queries'
import { historyQueriesConfig } from './queries/history-queries'
import { runningQueriesConfig } from './queries/running-queries'
import { mergePerformanceConfig } from './merges/merge-performance'
import { mutationsConfig } from './merges/mutations'
import { settingsConfig } from './more/settings'
import { mergeTreeSettingsConfig } from './more/mergetree-settings'
import { disksConfig } from './more/disks'
import { backupsConfig } from './more/backups'

export const queries: Array<QueryConfig> = [
  {
    name: 'global-table-overview',
    sql: `
      SELECT
          table,
          sum(rows) AS rows,
          max(modification_time) AS latest_modification,
          formatReadableSize(sum(bytes)) AS data_size,
          formatReadableSize(sum(primary_key_bytes_in_memory)) AS primary_keys_size,
          any(engine) AS engine,
          sum(bytes) AS bytes_size
      FROM system.parts
      WHERE active
      GROUP BY
          database,
          table
      ORDER BY bytes_size DESC
    `,
    columns: [
      'table',
      'rows',
      'data_size',
      'latest_modification',
      'primary_keys_size',
      'engine',
      'bytes_size',
    ],
  },

  runningQueriesConfig,
  historyQueriesConfig,
  failedQueriesConfig,
  commonErrorsConfig,
  expensiveQueriesConfig,
  expensiveQueriesByMemoryConfig,

  mergesConfig,
  mergePerformanceConfig,
  mutationsConfig,

  settingsConfig,
  mergeTreeSettingsConfig,
  disksConfig,

  backupsConfig

  {
    name: 'replicas',
    description: `Contains information and status for replicated tables residing on the local server`,
    sql: `
      SELECT *,
             database || '.' || table as table
      FROM system.replicas
      ORDER BY database, table
    `,
    columns: [
      'table',
      'engine',
      'future_parts',
      'queue_size',
      'absolute_delay',
      'total_replicas',
      'active_replicas',
      'is_leader',
      'can_become_leader',
      'is_readonly',
      'is_session_expired',
      'parts_to_check',
      'zookeeper_path',
      'replica_name',
      'replica_path',
      'columns_version',
      'inserts_in_queue',
      'merges_in_queue',
      'part_mutations_in_queue',
      'queue_oldest_time',
      'inserts_oldest_time',
      'merges_oldest_time',
      'part_mutations_oldest_time',
      'oldest_part_to_get',
      'oldest_part_to_merge_to',
      'oldest_part_to_mutate_to',
      'log_max_index',
      'log_pointer',
      'last_queue_update',
      'last_queue_update_exception',
      'zookeeper_exception',
    ],
    columnFormats: {
      table: ColumnFormat.ColoredBadge,
      engine: ColumnFormat.ColoredBadge,
      is_leader: ColumnFormat.Boolean,
      can_become_leader: ColumnFormat.Boolean,
      is_readonly: ColumnFormat.Boolean,
      is_session_expired: ColumnFormat.Boolean,
      replica_name: ColumnFormat.ColoredBadge,
    },
    relatedCharts: [
      [
        'replication-queue-count',
        {
          title: 'Replication Status',
        },
      ],
      [
        'replication-summary-table',
        {
          title: 'Replication Summary',
        },
      ],
    ],
  },
  {
    name: 'replication-queue',
    description: `Contains information about tasks from replication queues stored in ClickHouse Keeper, or ZooKeeper, for tables in the ReplicatedMergeTree family`,
    sql: `
      SELECT *,
             database || '.' || table as table
      FROM system.replication_queue
      ORDER BY is_currently_executing DESC, create_time DESC
    `,
    columns: [
      'table',
      'replica_name',
      'position',
      'node_name',
      'type',
      'create_time',
      'required_quorum',
      'source_replica',
      'new_part_name',
      'parts_to_merge',
      'is_detach',
      'is_currently_executing',
      'num_tries',
      'last_exception',
      'last_exception_time',
      'last_attempt_time',
      'num_postponed',
      'postpone_reason',
      'last_postpone_time',
      'merge_type',
    ],
    columnFormats: {
      table: ColumnFormat.ColoredBadge,
      create_time: ColumnFormat.RelatedTime,
      last_exception_time: ColumnFormat.RelatedTime,
      last_attempt_time: ColumnFormat.RelatedTime,
      last_postpone_time: ColumnFormat.RelatedTime,
      type: ColumnFormat.ColoredBadge,
      is_detach: ColumnFormat.Boolean,
      is_currently_executing: ColumnFormat.Boolean,
      required_quorum: ColumnFormat.Boolean,
      last_exception: ColumnFormat.CodeToggle,
    },
    relatedCharts: [
      [
        'replication-queue-count',
        {
          title: 'Replication Status',
        },
      ],
      [
        'replication-summary-table',
        {
          title: 'Replication Summary',
        },
      ],
    ],
  },
  {
    name: 'metrics',
    description:
      'Contains metrics which can be calculated instantly, or have a current value',
    sql: `
      SELECT *
      FROM system.metrics
      ORDER BY metric
    `,
    columns: ['metric', 'value', 'description'],
    columnFormats: {
      metric: ColumnFormat.Code,
      value: ColumnFormat.Code,
    },
  },
  {
    name: 'asynchronous-metrics',
    description:
      'Contains metrics that are calculated periodically in the background. For example, the amount of RAM in use',
    sql: `
      SELECT *
      FROM system.asynchronous_metrics
      ORDER BY metric
    `,
    columns: ['metric', 'value', 'description'],
    columnFormats: {
      metric: ColumnFormat.Code,
      value: ColumnFormat.Code,
    },
  },
  {
    name: 'top-usage-tables',
    description:
      'Most usage tables, ignore system tables, based on system.query_log (top 50)',
    sql: `
      SELECT
          tables as table,
          count() as count,
          round(100 * count() / max(count()) OVER ()) as pct_count
      FROM system.query_log
      ARRAY JOIN tables
      WHERE (query_kind = 'Select')
        AND (type = 'QueryFinish')
        AND (tables NOT LIKE '%temp%')
        AND (tables NOT LIKE '_table_function%')
        AND (tables NOT LIKE 'system%')
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 50`,
    columns: ['table', 'count'],
    columnFormats: {
      table: [ColumnFormat.Link, { href: `/top-usage-columns?table=[table]` }],
      count: ColumnFormat.BackgroundBar,
    },
  },
  {
    name: 'top-usage-columns',
    description: 'Most usage columns of table based on system.query_log',
    sql: `
      SELECT
          columns as column,
          count() as count,
          round(100 * count() / max(count()) OVER ()) as pct_count
      FROM system.query_log
      ARRAY JOIN columns
      WHERE (query_kind = 'Select')
        AND (type = 'QueryFinish')
        AND (has(tables, {table: String}))
        AND (positionCaseInsensitive(column, {table:String}) != 0)
      GROUP BY 1
      ORDER BY 2 DESC`,
    columns: ['column', 'count'],
    columnFormats: {
      count: ColumnFormat.BackgroundBar,
    },
  },
]

export const getQueryConfigByName = (name: string) => {
  if (!name) {
    return null
  }

  return queries.find((q) => q.name === name)
}
