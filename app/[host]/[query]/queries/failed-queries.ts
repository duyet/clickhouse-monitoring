import { QUERY_LOG } from '@/lib/table-notes'
import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const failedQueriesConfig: QueryConfig = {
  name: 'failed-queries',
  description: "type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']",
  docs: QUERY_LOG,
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
        toString(databases) AS databases,
        toString(tables) AS tables,
        toString(columns) AS columns,
        toString(used_aggregate_functions) AS used_aggregate_functions,
        toString(used_aggregate_function_combinators) AS used_aggregate_function_combinators,
        toString(used_database_engines) AS used_database_engines,
        toString(used_data_type_families) AS used_data_type_families,
        toString(used_dictionaries) AS used_dictionaries,
        toString(used_formats) AS used_formats,
        toString(used_functions) AS used_functions,
        toString(used_storages) AS used_storages,
        toString(used_table_functions) AS used_table_functions,
        toString(thread_ids) AS thread_ids,
        ProfileEvents,
        Settings
    FROM system.query_log
    WHERE type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
    ORDER BY query_start_time DESC
    LIMIT 1000
  `,
  columns: [
    'normalized_query',
    'exception',
    'type',
    'query_start_time',
    'query_duration_ms',
    'query_id',
    'query_kind',
    'is_initial_query',
    'read',
    'written',
    'result',
    'memory usage',
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
    normalized_query: [
      ColumnFormat.CodeDialog,
      {
        trigger_classname: 'w-80 line-clamp-4',
        dialog_classname: 'max-w-screen-xl',
        max_truncate: 200,
      },
    ],
    type: ColumnFormat.ColoredBadge,
    query_duration_ms: ColumnFormat.Duration,
    query_start_time: ColumnFormat.RelatedTime,
    exception: [
      ColumnFormat.CodeDialog,
      { trigger_classname: 'w-80 line-clamp-2' },
    ],
    stack_trace: ColumnFormat.CodeDialog,
    client: ColumnFormat.CodeDialog,
    user: ColumnFormat.ColoredBadge,
    initial_user: ColumnFormat.ColoredBadge,
    is_initial_query: ColumnFormat.Boolean,
    query_kind: ColumnFormat.Badge,
    databases: ColumnFormat.CodeDialog,
    tables: ColumnFormat.CodeDialog,
    columns: ColumnFormat.CodeDialog,
    used_aggregate_functions: ColumnFormat.CodeDialog,
    used_aggregate_function_combinators: ColumnFormat.CodeDialog,
    used_formats: ColumnFormat.CodeDialog,
    used_dictionaries: ColumnFormat.CodeDialog,
    used_functions: ColumnFormat.CodeDialog,
    used_table_functions: ColumnFormat.CodeDialog,
    thread_ids: ColumnFormat.CodeDialog,
  },
  relatedCharts: [
    [
      'failed-query-count',
      {
        title: 'Failed Queries over last 7 days (Exception Types)',
        interval: 'toStartOfHour',
        lastHours: 24 * 7,
        showLegend: false,
      },
    ],
    'break',
    [
      'failed-query-count-by-user',
      {
        title: 'Failed Queries over last 7 days (Users)',
        interval: 'toStartOfHour',
        lastHours: 24 * 7,
        showLegend: false,
      },
    ],
    [
      'failed-query-count-by-user',
      {
        title: 'Failed Queries over last 24 hours (Users)',
        interval: 'toStartOfHour',
        lastHours: 24,
        showLegend: false,
      },
    ],
  ],
}
