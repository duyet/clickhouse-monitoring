/**
 * System Metrics Charts
 * Charts for CPU, memory, disk, and other system-level metrics
 */

import type { ChartQueryBuilder } from './types'
import { applyInterval } from './types'

export const systemCharts: Record<string, ChartQueryBuilder> = {
  'memory-usage': ({ interval = 'toStartOfTenMinutes', lastHours = 24 }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           avg(CurrentMetric_MemoryTracking) AS avg_memory,
           formatReadableSize(avg_memory) AS readable_avg_memory
    FROM merge('system', '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1 ASC`,
    optional: true,
    tableCheck: 'system.metric_log',
  }),

  'cpu-usage': ({ interval = 'toStartOfTenMinutes', lastHours = 24 }) => ({
    query: `
    SELECT
       ${applyInterval(interval, 'event_time')},
       avg(ProfileEvent_OSCPUVirtualTimeMicroseconds) / 1000000 as avg_cpu
    FROM merge('system', '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1`,
    optional: true,
    tableCheck: 'system.metric_log',
  }),

  'disk-size': ({ params }) => {
    const name = params?.name as string | undefined
    const condition = name ? `WHERE name = '${name}'` : ''
    return {
      query: `
    SELECT name,
           (total_space - unreserved_space) AS used_space,
           formatReadableSize(used_space) AS readable_used_space,
           total_space,
           formatReadableSize(total_space) AS readable_total_space
    FROM system.disks
    ${condition}
    ORDER BY name
  `,
    }
  },

  'disks-usage': ({ interval = 'toStartOfDay', lastHours = 24 * 30 }) => ({
    query: `
    WITH CAST(sumMap(map(metric, value)), 'Map(LowCardinality(String), UInt32)') AS map
    SELECT
        ${applyInterval(interval, 'event_time')},
        map['DiskAvailable_default'] as DiskAvailable_default,
        map['DiskUsed_default'] as DiskUsed_default,
        formatReadableSize(DiskAvailable_default) as readable_DiskAvailable_default,
        formatReadableSize(DiskUsed_default) as readable_DiskUsed_default
    FROM merge('system', '^asynchronous_metric_log')
    WHERE event_time >= (now() - toIntervalHour(${lastHours}))
    GROUP BY 1
    ORDER BY 1 ASC
  `,
    optional: true,
    tableCheck: 'system.asynchronous_metric_log',
  }),

  'backup-size': ({ lastHours }) => {
    const startTimeCondition = lastHours
      ? `AND start_time > (now() - INTERVAL ${lastHours} HOUR)`
      : ''

    return {
      query: `
    SELECT
      SUM(total_size) as total_size,
      SUM(uncompressed_size) as uncompressed_size,
      SUM(compressed_size) as compressed_size,
      formatReadableSize(total_size) as readable_total_size,
      formatReadableSize(uncompressed_size) as readable_uncompressed_size,
      formatReadableSize(compressed_size) as readable_compressed_size
    FROM system.backup_log
    WHERE status = 'BACKUP_CREATED'
          ${startTimeCondition}
  `,
      optional: true,
      tableCheck: 'system.backup_log',
    }
  },

  'new-parts-created': ({
    interval = 'toStartOfFifteenMinutes',
    lastHours = 24,
  }) => ({
    query: `
    SELECT
        ${applyInterval(interval, 'event_time')},
        count() AS new_parts,
        table,
        sum(rows) AS total_rows,
        formatReadableQuantity(total_rows) AS readable_total_rows,
        sum(size_in_bytes) AS total_bytes_on_disk,
        formatReadableSize(total_bytes_on_disk) AS readable_total_bytes_on_disk
    FROM system.part_log
    WHERE (event_type = 'NewPart')
      AND (event_time > (now() - toIntervalHour(${lastHours})))
    GROUP BY
        event_time,
        table
    ORDER BY
        event_time ASC,
        table DESC
  `,
  }),

  'summary-used-by-running-queries': () => ({
    queries: [
      {
        key: 'main',
        query: `
          SELECT COUNT() as query_count,
                 SUM(memory_usage) as memory_usage,
                 formatReadableSize(memory_usage) as readable_memory_usage
          FROM system.processes
        `,
      },
      {
        key: 'totalMem',
        query: `
          SELECT metric,
                 value as total,
                 formatReadableSize(total) AS readable_total
          FROM system.asynchronous_metrics
          WHERE metric = 'CGroupMemoryUsed'
                OR metric = 'OSMemoryTotal'
          ORDER BY metric ASC
          LIMIT 1
        `,
      },
      {
        key: 'todayQueryCount',
        query: `
          SELECT COUNT() as query_count
          FROM system.query_log
          WHERE type = 'QueryStart'
                AND query_start_time >= today()
        `,
      },
      {
        key: 'rowsReadWritten',
        query: `
          SELECT SUM(read_rows) as rows_read,
                 SUM(written_rows) as rows_written,
                 formatReadableQuantity(rows_read) as readable_rows_read,
                 formatReadableQuantity(rows_written) as readable_rows_written
          FROM system.processes
        `,
      },
    ],
  }),

  'summary-used-by-mutations': () => ({
    query: `
    SELECT COUNT() as running_count
    FROM system.mutations
    WHERE is_done = 0
  `,
  }),

  'top-table-size': ({ params }) => {
    const limit = (params?.limit as number) || 7
    return {
      query: `
      SELECT
        (database || '.' || table) as table,
        sum(data_compressed_bytes) as compressed_bytes,
        sum(data_uncompressed_bytes) AS uncompressed_bytes,
        formatReadableSize(compressed_bytes) AS compressed,
        formatReadableSize(uncompressed_bytes) AS uncompressed,
        round(uncompressed_bytes / compressed_bytes, 2) AS compr_rate,
        sum(rows) AS total_rows,
        formatReadableQuantity(sum(rows)) AS readable_total_rows,
        count() AS part_count
    FROM system.parts
    WHERE (active = 1) AND (database != 'system') AND (table LIKE '%')
    GROUP BY 1
    ORDER BY compressed_bytes DESC
    LIMIT ${limit}`,
    }
  },
}
