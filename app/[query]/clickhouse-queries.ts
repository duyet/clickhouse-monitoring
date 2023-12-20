import { QUERY_COMMENT } from '@/lib/clickhouse'
import type { QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/columns'

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
  {
    name: 'running-queries',
    sql: `
      SELECT *,
        formatReadableQuantity(read_rows) as readable_read_rows,
        formatReadableQuantity(total_rows_approx) as readable_total_rows_approx,
        formatReadableSize(memory_usage) as readable_memory_usage,
        formatReadableSize(peak_memory_usage) as readable_peak_memory_usage,
        if(total_rows_approx > 0  AND query_kind != 'Insert', toString(round((100 * read_rows) / total_rows_approx, 2)) || '%', '') AS progress,
        (elapsed / (read_rows / total_rows_approx)) * (1 - (read_rows / total_rows_approx)) AS estimated_remaining_time
      FROM system.processes
      WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'
      ORDER BY elapsed
    `,
    columns: [
      'query',
      'user',
      'elapsed',
      'readable_read_rows',
      'readable_memory_usage',
      'progress',
      'query_id',
    ],
    columnFormats: {
      query: ColumnFormat.CodeToggle,
      elapsed: ColumnFormat.Duration,
      estimated_remaining_time: ColumnFormat.Duration,
      query_id: [ColumnFormat.Action, ['kill-query']],
    },
    relatedCharts: [
      [
        'query-count',
        {
          title: 'Total Running Queries over last 12 hours (query / 5 minutes)',
          interval: 'toStartOfFiveMinutes',
          lastHours: 12,
        },
      ],
      [
        'query-count-by-user',
        {
          title: 'Total Queries over last 14 days by users',
          interval: 'toStartOfDay',
          lastHours: 24 * 14,
          showLegend: false,
        },
      ],
      [
        'summary-used-by-running-queries',
        {
          title: 'Summary of current running queries',
        },
      ],
    ],
  },
  {
    name: 'history-queries',
    sql: `
      SELECT
          type,
          query_id,
          query_duration_ms,
          query_duration_ms as query_duration,
          event_time,
          query,
          formatted_query AS readable_query,
          user,
          read_rows,
          formatReadableQuantity(read_rows) AS readable_read_rows,
          written_rows,
          formatReadableQuantity(written_rows) AS readable_written_rows,
          result_rows,
          formatReadableQuantity(result_rows) AS readable_result_rows,
          memory_usage,
          formatReadableSize(memory_usage) AS readable_memory_usage,
          query_kind,
          client_name
      FROM system.query_log
      WHERE type != 'QueryStart'
      ORDER BY event_time DESC
      LIMIT 1000
    `,
    columns: [
      'user',
      'type',
      'query',
      'event_time',
      'query_id',
      'query_duration',
      'readable_read_rows',
      'readable_written_rows',
      'readable_result_rows',
      'readable_memory_usage',
      'query_kind',
      'client_name',
    ],
    columnFormats: {
      user: ColumnFormat.ColoredBadge,
      type: ColumnFormat.ColoredBadge,
      query_duration: ColumnFormat.Duration,
      query_kind: ColumnFormat.ColoredBadge,
      readable_query: ColumnFormat.Code,
      query: ColumnFormat.Code,
      event_time: ColumnFormat.RelatedTime,
    },

    relatedCharts: [
      [
        'query-count',
        {
          title: 'Total Running Queries over last 14 days (query / day)',
          interval: 'toStartOfDay',
          lastHours: 24 * 14,
        },
      ],
    ],
  },
  {
    name: 'failed-queries',
    sql: `
      SELECT
          type,
          query_start_time,
          query_duration_ms,
          query_id,
          query_kind,
          is_initial_query,
          normalizeQuery(query) AS normalized_query,
          concat(toString(read_rows), ' rows / ', formatReadableSize(read_bytes)) AS read,
          concat(toString(written_rows), ' rows / ', formatReadableSize(written_bytes)) AS written,
          concat(toString(result_rows), ' rows / ', formatReadableSize(result_bytes)) AS result,
          formatReadableSize(memory_usage) AS memory_usage,
          exception,
          concat('\n', stack_trace) AS stack_trace,
          user,
          initial_user,
          multiIf(empty(client_name), http_user_agent, concat(client_name, ' ', toString(client_version_major), '.', toString(client_version_minor), '.', toString(client_version_patch))) AS client,
          client_hostname,
          databases,
          tables,
          columns,
          used_aggregate_functions,
          used_aggregate_function_combinators,
          used_database_engines,
          used_data_type_families,
          used_dictionaries,
          used_formats,
          used_functions,
          used_storages,
          used_table_functions,
          thread_ids,
          ProfileEvents,
          Settings
      FROM system.query_log
      WHERE type IN ['3', '4']
      ORDER BY query_start_time DESC
      LIMIT 100
    `,
    columns: [
      'type',
      'query_start_time',
      'query_duration_ms',
      'query_id',
      'query_kind',
      'is_initial_query',
      'normalized_query',
      'read',
      'written',
      'result',
      'memory usage',
      'exception',
      'stack_trace',
      'user',
      'initial_user',
      'client',
      'client_hostname',
      'databases',
      'tables',
      'columns',
      'used_aggregate_functions',
      'used_aggregate_function_combinators',
      'used_database_engines',
      'used_data_type_families',
      'used_dictionaries',
      'used_formats',
      'used_functions',
      'used_storages',
      'used_table_functions',
      'thread_ids',
    ],
    columnFormats: {
      type: ColumnFormat.ColoredBadge,
      query_duration_ms: ColumnFormat.Duration,
      query_start_time: ColumnFormat.RelatedTime,
      normalized_query: ColumnFormat.Code,
      exception: ColumnFormat.Code,
      stack_trace: ColumnFormat.Code,
      client: ColumnFormat.Code,
    },
  },
  {
    name: 'common-errors',
    description:
      'This table `system.errors` contains error codes and the number of times each error has been triggered. Furthermore, we can see when the error last occurred coupled with the exact error message',
    sql: `
      SELECT
          name,
          code,
          value,
          last_error_time,
          last_error_message,
          last_error_trace AS remote
      FROM system.errors
      ORDER BY last_error_time DESC
      LIMIT 1000
    `,
    columns: [
      'name',
      'code',
      'value',
      'last_error_time',
      'last_error_message',
      'remote',
    ],
    columnFormats: {
      name: ColumnFormat.ColoredBadge,
      code: ColumnFormat.ColoredBadge,
      last_error_time: ColumnFormat.RelatedTime,
      remote: ColumnFormat.Code,
    },
  },
  {
    name: 'expensive-queries',
    description: 'Most expensive queries finished over last 24 hours',
    sql: `
      SELECT
          normalized_query_hash,
          replace(substr(argMax(query, utime), 1, 200), '\n', ' ') AS query,
          count() AS cnt,
          sum(query_duration_ms) / 1000 AS queries_duration,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'RealTimeMicroseconds')]) / 1000000 AS real_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'UserTimeMicroseconds')] AS utime) / 1000000 AS user_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'SystemTimeMicroseconds')]) / 1000000 AS system_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'DiskReadElapsedMicroseconds')]) / 1000000 AS disk_read_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'DiskWriteElapsedMicroseconds')]) / 1000000 AS disk_write_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'NetworkSendElapsedMicroseconds')]) / 1000000 AS network_send_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'NetworkReceiveElapsedMicroseconds')]) / 1000000 AS network_receive_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'ZooKeeperWaitMicroseconds')]) / 1000000 AS zookeeper_wait_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'OSIOWaitMicroseconds')]) / 1000000 AS os_io_wait_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'OSCPUWaitMicroseconds')]) / 1000000 AS os_cpu_wait_time,
          sum(ProfileEvents.Values[indexOf(ProfileEvents.Names, 'OSCPUVirtualTimeMicroseconds')]) / 1000000 AS os_cpu_virtual_time,
          sum(read_rows) AS read_rows,
          formatReadableSize(sum(read_bytes)) AS read_bytes,
          sum(written_rows) AS written_rows,
          formatReadableSize(sum(written_bytes)) AS written_bytes,
          sum(result_rows) AS result_rows,
          formatReadableSize(sum(result_bytes)) AS result_bytes
      FROM system.query_log
      WHERE (event_time > (now() - interval 24 hours)) AND (type IN (2, 4))
      GROUP BY
          GROUPING SETS (
              (normalized_query_hash),
              ())
      ORDER BY user_time DESC
      LIMIT 1000
    `,
    columns: [
      'query',
      'cnt',
      'queries_duration',
      'real_time',
      'user_time',
      'system_time',
      'disk_read_time',
      'disk_write_time',
      'network_send_time',
      'network_receive_time',
      'zookeeper_wait_time',
      'os_io_wait_time',
      'os_cpu_wait_time',
      'os_cpu_virtual_time',
      'read_rows',
      'read_bytes',
      'written_rows',
      'written_bytes',
      'result_rows',
      'result_bytes',
    ],
    columnFormats: {
      queries_duration: ColumnFormat.Duration,
      real_time: ColumnFormat.Duration,
      user_time: ColumnFormat.Duration,
      system_time: ColumnFormat.Duration,
      disk_read_time: ColumnFormat.Duration,
      disk_write_time: ColumnFormat.Duration,
      network_send_time: ColumnFormat.Duration,
      network_receive_time: ColumnFormat.Duration,
      zookeeper_wait_time: ColumnFormat.Duration,
      os_io_wait_time: ColumnFormat.Duration,
      os_cpu_wait_time: ColumnFormat.Duration,
      os_cpu_virtual_time: ColumnFormat.Duration,
      read_rows: ColumnFormat.Number,
      written_rows: ColumnFormat.Number,
      result_rows: ColumnFormat.Number,
    },
    relatedCharts: [],
  },
  {
    name: 'expensive-queries-by-memory',
    description: 'Most expensive queries by memory finished over last 24 hours',
    sql: `
      SELECT
          query,
          user,
          count() as cnt,
          sum(memory_usage) AS sum_memory,
          avg(memory_usage) AS avg_memory,
          formatReadableSize(sum_memory) AS readable_sum_memory,
          formatReadableSize(avg_memory) AS readable_avg_memory,
          normalized_query_hash
      FROM system.query_log
      WHERE
          (event_time >= (now() - toIntervalDay(1)))
          AND query_kind = 'Select'
          AND type = 'QueryFinish'
      GROUP BY
          normalized_query_hash,
          query,
          user
      ORDER BY avg_memory DESC
      LIMIT 1000
    `,
    columns: [
      'query',
      'user',
      'cnt',
      'readable_avg_memory',
      'readable_sum_memory',
    ],
    columnFormats: {
      query: ColumnFormat.CodeToggle,
    },
  },
  {
    name: 'merges',
    sql: `
      SELECT *,
        (cast(round(progress * 100, 1), 'String') || '%') as readable_progress,
        formatReadableQuantity(rows_read) as readable_rows_read,
        formatReadableQuantity(rows_written) as readable_rows_written,
        formatReadableSize(memory_usage) as readable_memory_usage
      FROM system.merges
      ORDER BY progress DESC
    `,
    columns: [
      'database',
      'table',
      'elapsed',
      'readable_progress',
      'num_parts',
      'readable_rows_read',
      'readable_rows_written',
      'readable_memory_usage',
      'is_mutation',
      'merge_type',
      'merge_algorithm',
    ],
    columnFormats: {
      database: ColumnFormat.ColoredBadge,
      table: ColumnFormat.ColoredBadge,
      query: ColumnFormat.Code,
      elapsed: ColumnFormat.Duration,
      is_mutation: ColumnFormat.Boolean,
    },
    relatedCharts: [
      [
        'total-memory-used-by-merges',
        {
          title: 'Memory used by merges currently',
        },
      ],
      [
        'merge-count',
        {
          title: 'Merge over last 12 hours (avg / 5 minutes)',
          interval: 'toStartOfFiveMinutes',
          lastHours: 12,
        },
      ],
    ],
  },
  {
    name: 'settings',
    sql: `
      SELECT *
      FROM system.settings
      ORDER BY name
    `,
    columns: ['name', 'value', 'changed', 'description', 'default'],
    columnFormats: {
      name: ColumnFormat.Code,
      changed: ColumnFormat.Boolean,
      value: ColumnFormat.Code,
      default: ColumnFormat.Code,
    },
  },
  {
    name: 'settings',
    sql: `
      SELECT *
      FROM system.settings
      ORDER BY name
    `,
    columns: ['name', 'value', 'changed', 'description', 'default'],
    columnFormats: {
      name: ColumnFormat.Code,
      changed: ColumnFormat.Boolean,
      value: ColumnFormat.Code,
      default: ColumnFormat.Code,
    },
  },
  {
    name: 'mergetree-settings',
    sql: `
      SELECT name, value, changed, description, readonly, min, max, type, is_obsolete
      FROM system.merge_tree_settings
      ORDER BY name
    `,
    columns: [
      'name',
      'value',
      'changed',
      'description',
      'readonly',
      'min',
      'max',
      'type',
      'is_obsolete',
    ],
    columnFormats: {
      changed: ColumnFormat.Boolean,
      readonly: ColumnFormat.Boolean,
      is_obsolete: ColumnFormat.Boolean,
      value: ColumnFormat.Code,
      type: ColumnFormat.ColoredBadge,
    },
  },
  {
    name: 'disks',
    sql: `
      SELECT name,
             path,
             (total_space - unreserved_space) AS used_space,
             formatReadableSize(used_space) AS readable_used_space,
             unreserved_space,
             formatReadableSize(unreserved_space) AS readable_unreserved_space,
             free_space,
             formatReadableSize(free_space) AS readable_free_space,
             total_space,
             formatReadableSize(total_space) AS readable_total_space,
             toString(round(100.0 * free_space / total_space, 2)) || '%' AS percent_free,
             keep_free_space
      FROM system.disks
      ORDER BY name
    `,
    columns: [
      'name',
      'path',
      'readable_used_space',
      'readable_total_space',
      'readable_unreserved_space',
      'readable_free_space',
      'percent_free',
      'keep_free_space',
    ],
    columnFormats: {
      name: ColumnFormat.ColoredBadge,
    },
    relatedCharts: [
      [
        'disk-size',
        {
          title: 'Disk Used',
        },
      ],
      [
        'disks-usage',
        {
          title: 'Disk Usage over last 14 days',
          interval: 'toStartOfHour',
          lastHours: 24 * 14,
        },
      ],
    ],
  },
  {
    name: 'backups',
    description: `To restore a backup:
      RESTORE TABLE data_lake.events AS data_lake.events_restore FROM Disk('s3_backup', 'data_lake.events_20231212')`,
    sql: `
      SELECT *,
        formatReadableSize(total_size) as readable_total_size,
        formatReadableSize(uncompressed_size) as readable_uncompressed_size,
        formatReadableSize(compressed_size) as readable_compressed_size,
        formatReadableSize(bytes_read) as readable_bytes_read,
        formatReadableQuantity(files_read) as readable_files_read,
        formatReadableQuantity(num_entries) as readable_num_entries
      FROM system.backup_log
      ORDER BY start_time DESC
    `,
    columns: [
      'id',
      'name',
      'status',
      'start_time',
      'end_time',
      'num_files',
      'readable_total_size',
      'num_entries',
      'readable_uncompressed_size',
      'readable_compressed_size',
      'readable_files_read',
      'readable_bytes_read',
      'error',
    ],
    columnFormats: {
      status: ColumnFormat.ColoredBadge,
      start_time: ColumnFormat.RelatedTime,
      end_time: ColumnFormat.RelatedTime,
      error: ColumnFormat.Code,
      ProfileEvents: ColumnFormat.Code,
    },
    relatedCharts: [
      [
        'backup-size',
        {
          title: 'Backup over last day',
          lastHours: 24,
        },
      ],
      [
        'backup-size',
        {
          title: 'All backup',
        },
      ],
    ],
  },
]

export const getQueryConfigByName = (name: string) => {
  if (!name) {
    return null
  }

  return queries.find((q) => q.name === name)
}
