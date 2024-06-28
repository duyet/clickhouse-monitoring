import { ColumnFormat } from '@/lib/types/column-format'
import { type QueryConfig } from '@/lib/types/query-config'

export const expensiveQueriesConfig: QueryConfig = {
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
}
