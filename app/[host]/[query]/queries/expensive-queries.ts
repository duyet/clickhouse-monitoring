import { QUERY_LOG } from '@/lib/table-notes'
import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const expensiveQueriesConfig: QueryConfig = {
  name: 'expensive-queries',
  description: 'Most expensive queries finished over last 24 hours',
  docs: QUERY_LOG,
  sql: `
    WITH base_metrics AS (
        SELECT
            normalized_query_hash,
            replace(substr(argMax(query, utime), 1, 500), '\n', ' ') AS query,
            count() AS cnt,
            sum(query_duration_ms) / 1000 AS queries_duration,
            sum(ProfileEvents['RealTimeMicroseconds']) / 1000000 AS real_time,
            sum(ProfileEvents['UserTimeMicroseconds'] as utime) / 1000000 AS user_time,
            sum(ProfileEvents['SystemTimeMicroseconds']) / 1000000 AS system_time,
            sum(ProfileEvents['DiskReadElapsedMicroseconds']) / 1000000 AS disk_read_time,
            sum(ProfileEvents['DiskWriteElapsedMicroseconds']) / 1000000 AS disk_write_time,
            sum(ProfileEvents['NetworkSendElapsedMicroseconds']) / 1000000 AS network_send_time,
            sum(ProfileEvents['NetworkReceiveElapsedMicroseconds']) / 1000000 AS network_receive_time,
            sum(ProfileEvents['ZooKeeperWaitMicroseconds']) / 1000000 AS zookeeper_wait_time,
            sum(ProfileEvents['OSIOWaitMicroseconds']) / 1000000 AS os_io_wait_time,
            sum(ProfileEvents['OSCPUWaitMicroseconds']) / 1000000 AS os_cpu_wait_time,
            sum(ProfileEvents['OSCPUVirtualTimeMicroseconds']) / 1000000 AS os_cpu_virtual_time,
            formatReadableSize(sum(ProfileEvents['NetworkReceiveBytes'])) AS network_receive_bytes,
            formatReadableSize(sum(ProfileEvents['NetworkSendBytes'])) AS network_send_bytes,
            sum(ProfileEvents['SelectedParts']) as selected_parts,
            sum(ProfileEvents['SelectedRanges']) as selected_ranges,
            sum(ProfileEvents['SelectedMarks']) as selected_marks,
            sum(ProfileEvents['SelectedBytes']) as Selected_bytes,
            sum(ProfileEvents['FileOpen']) as file_open,
            sum(ProfileEvents['ZooKeeperTransactions']) as zookeeper_transactions,
            quantile(0.97)(memory_usage) as memory_usage_q97,
            formatReadableSize(memory_usage_q97) as readable_memory_usage_q97,
            sum(ProfileEvents['SelectedRows']) as selected_rows,
            sum(read_rows) AS read_rows,
            sum(written_rows) AS written_rows,
            sum(result_rows) AS result_rows,
            formatReadableSize(sum(read_bytes)) AS read_bytes,
            formatReadableSize(sum(written_bytes)) AS written_bytes,
            formatReadableSize(sum(result_bytes)) AS result_bytes
        FROM merge(system, '^query_log')
        WHERE (event_time > (now() - interval 24 hours)) AND (type IN (2, 4))
        GROUP BY normalized_query_hash
    )
    SELECT
        *,
        round(100 * cnt / max(cnt) OVER ()) AS pct_cnt,
        round(100 * queries_duration / max(queries_duration) OVER ()) AS pct_queries_duration,
        round(100 * memory_usage_q97 / max(memory_usage_q97) OVER ()) AS pct_memory_usage_q97,
        round(100 * read_rows / max(read_rows) OVER ()) AS pct_read_rows,
        round(100 * written_rows / max(written_rows) OVER ()) AS pct_written_rows,
        round(100 * result_rows / max(result_rows) OVER ()) AS pct_result_rows,
        round(100 * selected_rows / max(selected_rows) OVER ()) AS pct_selected_rows,
        round(100 * selected_parts / max(selected_parts) OVER ()) AS pct_selected_parts,
        round(100 * selected_ranges / max(selected_ranges) OVER ()) AS pct_selected_ranges,
        round(100 * selected_marks / max(selected_marks) OVER ()) AS pct_selected_marks
    FROM base_metrics
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
    'readable_memory_usage_q97',
    'selected_rows',
    'read_rows',
    'written_rows',
    'result_rows',
    'read_bytes',
    'written_bytes',
    'result_bytes',
    'selected_parts',
    'selected_marks',
    'selected_ranges',
    'selected_bytes',
  ],
  columnFormats: {
    query: [
      ColumnFormat.CodeDialog,
      { max_truncate: 100, hide_query_comment: true },
    ],
    cnt: [ColumnFormat.BackgroundBar, { numberFormat: true }],
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
    readable_memory_usage_q97: ColumnFormat.BackgroundBar,
    selected_rows: [ColumnFormat.BackgroundBar, { numberFormat: true }],
    selected_marks: [ColumnFormat.BackgroundBar, { numberFormat: true }],
    selected_parts: [ColumnFormat.BackgroundBar, { numberFormat: true }],
    selected_ranges: [ColumnFormat.BackgroundBar, { numberFormat: true }],
    read_rows: [ColumnFormat.BackgroundBar, { numberFormat: true }],
    written_rows: [ColumnFormat.BackgroundBar, { numberFormat: true }],
    result_rows: [ColumnFormat.BackgroundBar, { numberFormat: true }],
  },
  relatedCharts: [],
}
