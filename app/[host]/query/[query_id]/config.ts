import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'

export interface RowData {
  query_id: string
  kind: string
  type: string
  query: string
  is_initial_query: boolean
  user: string
  duration_ms: string

  interface_query_initial_from: string
  hostname: string
  client_hostname: string
  client_name: string
  client_revision: string
  initial_user: string
  initial_query_id: string
  initial_address: string
  initial_port: string
  initial_query_start_time: string
  databases: Array<string>
  tables: Array<string>
  columns: Array<string>
  partitions: Array<string>
  projections: Array<string>
  views: Array<string>
  exception_code: string
  exception: string
  stack_trace: string
  http_method: string
  http_user_agent: string
  http_referer: string
  forwarded_for: string
  quota_key: string
  distributed_depth: string
  revision: string
  log_comment: string
  ProfileEvents: Record<string, string>
  Settings: Record<string, string>
  query_cache_usage: string
  used_aggregate_functions: Array<string>
  used_aggregate_function_combinators: Array<string>
  used_database_engines: Array<string>
  used_data_type_families: Array<string>
  used_dictionaries: Array<string>
  used_formats: Array<string>
  used_functions: Array<string>
  used_storages: Array<string>
  used_table_functions: Array<string>
  used_row_policies: Array<string>
  used_privileges: Array<string>
  missing_privileges: Array<string>
  transaction_id: string
}

export const config: QueryConfig = {
  name: 'query',
  sql: `
    SELECT
        type,
        query_id,
        query_kind,
        query_cache_usage,
        query_duration_ms as duration_ms,
        query_duration_ms / 1000 as duration,
        event_time_microseconds,
        query_start_time_microseconds,

        -- The time in seconds since this stage started
        (now() - query_start_time) as elapsed,
        multiIf (elapsed < 30, format('{} seconds', round(elapsed, 1)),
                 elapsed < 90, 'a minute',
                 formatReadableTimeDelta(elapsed, 'days', 'minutes')) as readable_elapsed,
        event_time,
        query,
        is_initial_query,
        formatted_query AS readable_query,
        user,
        read_rows,
        formatReadableQuantity(read_rows) AS readable_read_rows,
        round(100 * read_rows / MAX(read_rows) OVER ()) AS pct_read_rows,
        written_rows,
        formatReadableQuantity(written_rows) AS readable_written_rows,
        round(100 * written_rows / MAX(written_rows) OVER ()) AS pct_written_rows,
        result_rows,
        formatReadableQuantity(result_rows) AS readable_result_rows,
        memory_usage,
        formatReadableSize(memory_usage) AS readable_memory_usage,
        round(100 * memory_usage / MAX(memory_usage) OVER ()) AS pct_memory_usage,
        length(thread_ids) as thread_ids_count,
        peak_threads_usage,

        -- General query info
        interface as interface_query_initial_from,
        hostname,
        client_hostname,
        client_name,
        client_revision,
        initial_user,
        initial_query_id,
        initial_address,
        initial_port,
        initial_query_start_time,
        databases,
        tables,
        columns,
        partitions,
        projections,
        views,
        exception_code,
        exception,
        stack_trace,
        http_method,
        http_user_agent,
        http_referer,
        forwarded_for,
        quota_key,
        distributed_depth,
        revision,
        log_comment,
        ProfileEvents,
        Settings,
        query_cache_usage,
        used_aggregate_functions,
        used_aggregate_function_combinators,
        used_database_engines,
        used_data_type_families,
        used_dictionaries,
        used_formats,
        used_functions,
        used_storages,
        used_table_functions,
        used_row_policies,
        used_privileges,
        missing_privileges,
        toString(transaction_id) as transaction_id
    FROM system.query_log
    WHERE
      initial_query_id = {query_id: String}
    ORDER BY event_time_microseconds
    LIMIT 1000
  `,
  columns: [
    'hostname',
    'type',
    'query_start_time_microseconds',
    'readable_elapsed',
    'duration_ms',
    'readable_memory_usage',
    'readable_read_rows',
    'readable_written_rows',
    'readable_result_rows',
    'query_cache_usage',
    'is_initial_query',
    'parts_lock_hold',
    'context_lock',
    'rw_lock_acquired_read_locks',
    'transaction_id',
    'thread_ids_count',
    'peak_threads_usage',
    'file_open',
    'query_id',
  ],
  columnFormats: {
    type: ColumnFormat.ColoredBadge,
    query: [
      ColumnFormat.CodeDialog,
      {
        max_truncate: 100,
        hide_query_comment: true,
        dialog_title: 'Running Query',
        trigger_classname: 'min-w-96',
      },
    ],
    user: ColumnFormat.ColoredBadge,
    estimated_remaining_time: ColumnFormat.Duration,
    readable_elapsed: ColumnFormat.BackgroundBar,
    readable_read_rows: ColumnFormat.BackgroundBar,
    readable_written_rows: ColumnFormat.BackgroundBar,
    readable_result_rows: ColumnFormat.BackgroundBar,
    readable_memory_usage: ColumnFormat.BackgroundBar,
    is_initial_query: ColumnFormat.Boolean,
    progress: ColumnFormat.BackgroundBar,
    file_open: ColumnFormat.Number,
    query_cache_usage: ColumnFormat.ColoredBadge,
    query_id: [
      ColumnFormat.Link,
      {
        href: '/[ctx.hostId]/query/[query_id]',
      },
    ],
  },
  defaultParams: {
    query_id: '',
  },
  relatedCharts: [],
}
