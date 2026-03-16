/**
 * System Metrics Charts
 * Charts for CPU, memory, disk, and other system-level metrics
 */

import type { ChartQueryBuilder } from './types'

import {
  applyInterval,
  buildTimeFilter,
  buildTimeFilterInterval,
} from './types'
import { STUCK_THRESHOLD_SECONDS } from '@/lib/query-config/merges/mutations'

export const systemCharts: Record<string, ChartQueryBuilder> = {
  'memory-usage': ({ interval = 'toStartOfTenMinutes', lastHours = 24 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    SELECT ${applyInterval(interval, 'event_time')},
           avg(CurrentMetric_MemoryTracking) AS avg_memory,
           formatReadableSize(avg_memory) AS readable_avg_memory
    FROM merge('system', '^metric_log')
    ${timeFilter ? `WHERE ${timeFilter}` : ''}
    GROUP BY 1
    ORDER BY 1 ASC`,
      optional: true,
      tableCheck: 'system.metric_log',
    }
  },

  'cpu-usage': ({ interval = 'toStartOfTenMinutes', lastHours = 24 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    SELECT
       ${applyInterval(interval, 'event_time')},
       avg(ProfileEvent_OSCPUVirtualTimeMicroseconds) / 1000000 as avg_cpu
    FROM merge('system', '^metric_log')
    ${timeFilter ? `WHERE ${timeFilter}` : ''}
    GROUP BY 1
    ORDER BY 1`,
      optional: true,
      tableCheck: 'system.metric_log',
    }
  },

  'disk-size': ({ params }) => {
    const name = params?.name as string | undefined
    // Sanitize disk name: allow only alphanumeric, underscore, hyphen
    const safeName = name && /^[\w-]+$/.test(name) ? name : undefined
    const condition = safeName ? `WHERE name = '${safeName}'` : ''
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

  'disks-usage': ({ interval = 'toStartOfDay', lastHours = 24 * 30 }) => {
    const timeFilter = buildTimeFilterInterval(lastHours)
    return {
      query: `
    WITH CAST(sumMap(map(metric, value)), 'Map(LowCardinality(String), UInt32)') AS map
    SELECT
        ${applyInterval(interval, 'event_time')},
        map['DiskAvailable_default'] as DiskAvailable_default,
        map['DiskUsed_default'] as DiskUsed_default,
        formatReadableSize(DiskAvailable_default) as readable_DiskAvailable_default,
        formatReadableSize(DiskUsed_default) as readable_DiskUsed_default
    FROM merge('system', '^asynchronous_metric_log')
    ${timeFilter ? `WHERE ${timeFilter}` : ''}
    GROUP BY 1
    ORDER BY 1 ASC
  `,
      optional: true,
      tableCheck: 'system.asynchronous_metric_log',
    }
  },

  'backup-size': ({ lastHours }) => {
    const safeLastHours =
      typeof lastHours === 'number' &&
      Number.isFinite(lastHours) &&
      lastHours > 0
        ? Math.floor(lastHours)
        : undefined
    const startTimeCondition = safeLastHours
      ? `AND start_time > (now() - INTERVAL ${safeLastHours} HOUR)`
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
  }) => {
    const timeFilter = buildTimeFilterInterval(lastHours)
    return {
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
    WHERE toInt8(event_type) = 1
      ${timeFilter ? `AND ${timeFilter}` : ''}
    GROUP BY
        event_time,
        table
    ORDER BY
        event_time ASC,
        table DESC
  `,
    }
  },

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

  'summary-stuck-mutations': () => ({
    query: `
    SELECT
      countIf(is_done = 0) AS active,
      countIf(is_done = 0 AND parts_to_do > 0 AND (now() - create_time) > ${STUCK_THRESHOLD_SECONDS}) AS stuck,
      countIf(latest_fail_reason != '') AS failed
    FROM system.mutations
  `,
  }),

  'disk-usage-trend': ({ interval = 'toStartOfHour', lastHours = 24 * 7 }) => {
    const timeFilter = buildTimeFilterInterval(lastHours)
    return {
      query: `
    SELECT
        ${applyInterval(interval, 'event_time')},
        metric,
        avg(value) AS usage
    FROM merge('system', '^asynchronous_metric_log')
    WHERE metric LIKE 'DiskUsed_%'
      ${timeFilter ? `AND ${timeFilter}` : ''}
    GROUP BY 1, metric
    ORDER BY 1 ASC
  `,
      optional: true,
      tableCheck: 'system.asynchronous_metric_log',
    }
  },

  'disk-usage-by-database': () => ({
    query: `
    SELECT
      database,
      sum(bytes_on_disk) AS total_bytes,
      formatReadableSize(total_bytes) AS readable_size,
      sum(rows) AS total_rows,
      formatReadableQuantity(total_rows) AS readable_rows,
      count() AS part_count
    FROM system.parts
    WHERE active
    GROUP BY database
    ORDER BY total_bytes DESC
  `,
  }),

  'parts-per-table': () => ({
    query: `
    SELECT
      concat(database, '.', table) AS table_path,
      count() AS part_count,
      formatReadableQuantity(part_count) AS readable_part_count,
      sum(rows) AS total_rows,
      sum(bytes_on_disk) AS total_bytes,
      formatReadableSize(total_bytes) AS readable_size
    FROM system.parts
    WHERE active
    GROUP BY database, table
    ORDER BY part_count DESC
    LIMIT 20`,
  }),

  'top-table-size': ({ params }) => {
    const rawLimit = Number(params?.limit)
    const limit =
      Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 100
        ? rawLimit
        : 7
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
        formatReadableQuantity(total_rows) AS readable_total_rows,
        count() AS part_count
    FROM system.parts
    WHERE (active = 1) AND (database != 'system') AND (table LIKE '%')
    GROUP BY 1
    ORDER BY compressed_bytes DESC
    LIMIT ${limit}`,
    }
  },

  'mutation-progress': () => ({
    query: `
    SELECT
      mutation_id,
      concat(database, '.', table) AS table_path,
      command,
      parts_to_do,
      formatReadableQuantity(parts_to_do) AS readable_parts_to_do,
      if(is_done, 'done', if(parts_to_do = 0, 'waiting', 'running')) AS status,
      dateDiff('second', create_time, now()) AS elapsed_seconds,
      formatReadableTimeDelta(dateDiff('second', create_time, now())) AS readable_elapsed,
      latest_fail_reason
    FROM system.mutations
    WHERE is_done = 0
    ORDER BY create_time ASC
  `,
  }),

  'data-freshness': () => ({
    query: `
    WITH latest_data AS (
      SELECT
        database,
        table,
        concat(database, '.', table) AS table_path,
        max(modification_time) AS latest_part_time,
        count() AS active_parts,
        sum(rows) AS total_rows,
        dateDiff('second', latest_part_time, now()) AS staleness_seconds
      FROM system.parts
      WHERE active = 1
        AND database NOT IN ('system', 'information_schema', 'INFORMATION_SCHEMA')
      GROUP BY database, table
    )
    SELECT
      table_path,
      latest_part_time,
      staleness_seconds,
      formatReadableTimeDelta(staleness_seconds) AS readable_staleness,
      active_parts,
      formatReadableQuantity(total_rows) AS readable_rows
    FROM latest_data
    ORDER BY staleness_seconds DESC, database ASC, table ASC
    LIMIT 20`,
  }),

  'compression-ratio': () => ({
    query: `
    SELECT
      concat(database, '.', table) AS table_path,
      sum(data_compressed_bytes) AS compressed_bytes,
      sum(data_uncompressed_bytes) AS uncompressed_bytes,
      formatReadableSize(compressed_bytes) AS compressed_size,
      formatReadableSize(uncompressed_bytes) AS uncompressed_size,
      round(uncompressed_bytes / nullIf(compressed_bytes, 0), 2) AS compression_ratio,
      formatReadableQuantity(sum(rows)) AS readable_rows
    FROM system.parts
    WHERE active = 1
      AND database NOT IN ('system', 'information_schema', 'INFORMATION_SCHEMA')
    GROUP BY database, table
    HAVING compressed_bytes > 0
    ORDER BY compression_ratio ASC, table_path ASC
    LIMIT 20`,
  }),

  'partition-part-health': () => ({
    query: `
    SELECT
      concat(database, '.', table) AS table_path,
      partition,
      count() AS part_count,
      formatReadableQuantity(part_count) AS readable_part_count,
      sum(rows) AS total_rows,
      formatReadableQuantity(total_rows) AS readable_rows,
      sum(bytes_on_disk) AS total_bytes,
      formatReadableSize(total_bytes) AS readable_size
    FROM system.parts
    WHERE active
      AND database NOT IN ('system', 'INFORMATION_SCHEMA', 'information_schema')
    GROUP BY database, table, partition
    HAVING part_count > 50
    ORDER BY part_count DESC
    LIMIT 30
  `,
  }),

  'oom-killed-queries': ({
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
  }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
      SELECT
        ${applyInterval(interval, 'event_time')},
        count() AS kill_count,
        formatReadableQuantity(count()) AS readable_count
      FROM system.query_log
      WHERE type = 'ExceptionWhileProcessing'
        AND (exception_code = 241 OR exception LIKE '%MEMORY_LIMIT_EXCEEDED%')
        ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    }
  },

  'top-memory-queries': ({ lastHours = 24 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
      SELECT
        normalized_query_hash,
        any(substring(query, 1, 120)) AS query_preview,
        count() AS execution_count,
        max(memory_usage) AS peak_memory,
        formatReadableSize(max(memory_usage)) AS readable_peak_memory,
        avg(memory_usage) AS avg_memory,
        formatReadableSize(avg(memory_usage)) AS readable_avg_memory
      FROM system.query_log
      WHERE type = 'QueryFinish'
        ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY normalized_query_hash
      ORDER BY peak_memory DESC
      LIMIT 15
    `,
    }
  },

  // NOTE: 'replication-lag' is defined in replication-charts.ts (authoritative)

  'health-readonly-replicas': () => ({
    query: `
    SELECT count() AS readonly_count
    FROM system.replicas
    WHERE is_readonly = 1
  `,
    optional: true,
    tableCheck: 'system.replicas',
  }),

  'health-delayed-inserts': () => ({
    query: `
    SELECT
      value AS delayed_inserts
    FROM system.metrics
    WHERE metric = 'DelayedInserts'
  `,
  }),

  'health-max-part-count': () => ({
    query: `
    SELECT
      concat(database, '.', table) AS table_path,
      partition,
      count() AS part_count
    FROM system.parts
    WHERE active AND database NOT IN ('system', 'INFORMATION_SCHEMA', 'information_schema')
    GROUP BY database, table, partition
    ORDER BY part_count DESC
    LIMIT 1
  `,
  }),

  'keeper-requests': ({
    interval = 'toStartOfFifteenMinutes',
    lastHours = 24,
  }) => {
    const timeFilter = buildTimeFilterInterval(lastHours)
    return {
      query: `
      SELECT
        ${applyInterval(interval, 'event_time')},
        avg(value) AS avg_value,
        metric
      FROM merge('system', '^asynchronous_metric_log')
      WHERE metric IN ('ZooKeeperRequest', 'ZooKeeperWatch', 'ZooKeeperSession')
        ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY 1, metric
      ORDER BY 1 ASC
    `,
      optional: true,
      tableCheck: 'system.asynchronous_metric_log',
    }
  },

  'keeper-wait-time': ({
    interval = 'toStartOfFifteenMinutes',
    lastHours = 24,
  }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
      SELECT
        ${applyInterval(interval, 'event_time')},
        sum(ProfileEvent_ZooKeeperWaitMicroseconds) / 1000 AS wait_ms
      FROM merge('system', '^metric_log')
      ${timeFilter ? `WHERE ${timeFilter}` : ''}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
      optional: true,
      tableCheck: 'system.metric_log',
    }
  },

  'disk-io-throughput': ({
    interval = 'toStartOfFifteenMinutes',
    lastHours = 24,
  }) => {
    const timeFilter = buildTimeFilterInterval(lastHours)
    return {
      query: `
      SELECT
        ${applyInterval(interval, 'event_time')},
        metric,
        avg(value) AS avg_value
      FROM merge('system', '^asynchronous_metric_log')
      WHERE metric IN ('OSReadBytes', 'OSWriteBytes')
        ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY 1, metric
      ORDER BY 1 ASC
    `,
      optional: true,
      tableCheck: 'system.asynchronous_metric_log',
    }
  },

  'storage-policies': () => ({
    query: `
    SELECT
      policy_name,
      volume_name,
      disks,
      volume_priority,
      prefer_not_to_merge
    FROM system.storage_policies
    ORDER BY policy_name, volume_priority
  `,
  }),
}
