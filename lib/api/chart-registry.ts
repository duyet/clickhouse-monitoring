/**
 * Chart registry that maps chart names to their query builders
 * Provides centralized access to all available charts and their SQL queries
 * Extracted from chart components in components/charts/
 */

import type { ClickHouseInterval } from '@/types/clickhouse-interval'
import { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'

export interface ChartQueryParams {
  interval?: ClickHouseInterval
  lastHours?: number
  params?: Record<string, unknown>
}

export interface ChartQueryResult {
  query: string
  queryParams?: Record<string, unknown>
  optional?: boolean
  tableCheck?: string | string[]
}

type ChartQueryBuilder = (params: ChartQueryParams) => ChartQueryResult

/**
 * Chart registry mapping chart names to their SQL query builders.
 * This centralizes all chart queries for the API endpoints.
 */
export const chartRegistry: Record<string, ChartQueryBuilder> = {
  'query-count': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => ({
    query: `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge(system, '^query_log')
      WHERE type = 'QueryFinish'
            AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
      GROUP BY event_time
      ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
    ),
    query_kind AS (
      SELECT ${applyInterval(interval, 'event_time')},
               query_kind,
               COUNT() AS count
        FROM merge(system, '^query_log')
        WHERE type = 'QueryFinish'
              AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
        GROUP BY 1, 2
        ORDER BY 3 DESC
    ),
    breakdown AS (
      SELECT event_time,
             groupArray((query_kind, count)) AS breakdown
      FROM query_kind
      GROUP BY 1
    )
    SELECT event_time,
           query_count,
           breakdown.breakdown AS breakdown
    FROM event_count
    LEFT JOIN breakdown USING event_time
    ORDER BY 1
  `,
  }),

  'memory-usage': ({ interval = 'toStartOfTenMinutes', lastHours = 24 }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           avg(CurrentMetric_MemoryTracking) AS avg_memory,
           formatReadableSize(avg_memory) AS readable_avg_memory
    FROM merge(system, '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1 ASC`,
  }),

  'cpu-usage': ({ interval = 'toStartOfTenMinutes', lastHours = 24 }) => ({
    query: `
    SELECT
       ${applyInterval(interval, 'event_time')},
       avg(ProfileEvent_OSCPUVirtualTimeMicroseconds) / 1000000 as avg_cpu
    FROM merge(system, '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1`,
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

  'merge-count': ({ interval = 'toStartOfFiveMinutes', lastHours = 12 }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           avg(CurrentMetric_Merge) AS avg_CurrentMetric_Merge,
           avg(CurrentMetric_PartMutation) AS avg_CurrentMetric_PartMutation
    FROM merge(system, '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
  }),

  'merge-avg-duration': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => ({
    query: `
    SELECT
        ${applyInterval(interval, 'event_time')},
        AVG(duration_ms) AS avg_duration_ms,
        formatReadableTimeDelta(avg_duration_ms / 1000, 'seconds', 'milliseconds') AS readable_avg_duration_ms,
        bar(avg_duration_ms, 0, MAX(avg_duration_ms) OVER ()) AS bar
    FROM merge(system, '^part_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
      AND event_type = 'MergeParts'
      AND merge_reason = 'RegularMerge'
    GROUP BY 1
    ORDER BY 1 ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
  }),

  'merge-sum-read-rows': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => ({
    query: `
    SELECT
        ${applyInterval(interval, 'event_time')},
        SUM(read_rows) AS sum_read_rows,
        log10(sum_read_rows) * 100 AS sum_read_rows_scale,
        formatReadableQuantity(sum_read_rows) AS readable_sum_read_rows
    FROM merge(system, '^part_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
      AND event_type = 'MergeParts'
      AND merge_reason = 'RegularMerge'
    GROUP BY 1
    ORDER BY 1 ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
  }),

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

  'connections-http': ({ interval = 'toStartOfHour', lastHours = 24 * 7 }) => ({
    query: `
    /* HTTPConnection: Number of connections to HTTP server */
    /* HTTPConnectionsTotal: Total count of all sessions: stored in the pool and actively used right now for http hosts */

    SELECT
      ${applyInterval(interval, 'event_time')},
      SUM(CurrentMetric_HTTPConnection) AS CurrentMetric_HTTPConnection,
      formatReadableQuantity(CurrentMetric_HTTPConnection) AS readable_CurrentMetric_HTTPConnection,
      SUM(CurrentMetric_HTTPConnectionsTotal) AS CurrentMetric_HTTPConnectionsTotal,
      formatReadableQuantity(CurrentMetric_HTTPConnectionsTotal) AS readable_CurrentMetric_HTTPConnectionsTotal
    FROM system.metric_log
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `,
  }),

  'connections-interserver': ({
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
  }) => ({
    query: `
    SELECT
      ${applyInterval(interval, 'event_time')},
      SUM(CurrentMetric_InterserverConnection) AS CurrentMetric_InterserverConnection,
      formatReadableQuantity(CurrentMetric_InterserverConnection) AS readable_CurrentMetric_InterserverConnection
    FROM system.metric_log
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `,
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

  'disks-usage': ({ interval = 'toStartOfDay', lastHours = 24 * 30 }) => ({
    query: `
    WITH CAST(sumMap(map(metric, value)), 'Map(LowCardinality(String), UInt32)') AS map
    SELECT
        ${applyInterval(interval, 'event_time')},
        map['DiskAvailable_default'] as DiskAvailable_default,
        map['DiskUsed_default'] as DiskUsed_default,
        formatReadableSize(DiskAvailable_default) as readable_DiskAvailable_default,
        formatReadableSize(DiskUsed_default) as readable_DiskUsed_default
    FROM merge(system, '^asynchronous_metric_log')
    WHERE event_time >= (now() - toIntervalHour(${lastHours}))
    GROUP BY 1
    ORDER BY 1 ASC
  `,
  }),

  'failed-query-count': ({
    interval = 'toStartOfMinute',
    lastHours = 24 * 7,
  }) => ({
    query: `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge(system, '^query_log')
      WHERE
            type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
            AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
      GROUP BY 1
      ORDER BY 1
    ),
    query_type AS (
        SELECT ${applyInterval(interval, 'event_time')},
               type AS query_type,
               COUNT() AS count
        FROM merge(system, '^query_log')
        WHERE
              type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
              AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
        GROUP BY 1, 2
        ORDER BY 3 DESC
    ),
    breakdown AS (
      SELECT event_time,
             groupArray((query_type, count)) AS breakdown
      FROM query_type
      GROUP BY 1
    )
    SELECT event_time,
           query_count,
           breakdown.breakdown AS breakdown
    FROM event_count
    LEFT JOIN breakdown USING event_time
    ORDER BY 1
  `,
  }),

  'failed-query-count-by-user': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           user,
           countDistinct(query_id) AS count
    FROM merge(system, '^query_log')
    WHERE
          type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1, 2
    ORDER BY
      1 ASC,
      3 DESC
  `,
  }),

  'query-count-by-user': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           user,
           COUNT(*) AS count
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
          AND user != ''
    GROUP BY 1, 2
    ORDER BY
      1 ASC,
      3 DESC
  `,
  }),

  'query-duration': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           AVG(query_duration_ms) AS query_duration_ms,
           ROUND(query_duration_ms / 1000, 2) AS query_duration_s
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND query_kind = 'Select'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
  }),

  'query-memory': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           AVG(memory_usage) AS memory_usage,
           formatReadableSize(memory_usage) AS readable_memory_usage
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND query_kind = 'Select'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time ASC
  `,
  }),

  'query-type': ({ lastHours = 24 }) => ({
    query: `
    SELECT type,
           COUNT() AS query_count
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
  `,
  }),

  'query-cache': () => ({
    query: `
    SELECT
      sumIf(result_size, stale = 0) AS total_result_size,
      sumIf(result_size, stale = 1) AS total_staled_result_size,
      formatReadableSize(total_result_size) AS readable_total_result_size,
      formatReadableSize(total_staled_result_size) AS readable_total_staled_result_size
    FROM system.query_cache
  `,
  }),

  'replication-queue-count': () => ({
    query: `
    SELECT COUNT() as count_all,
           countIf(is_currently_executing) AS count_executing
    FROM system.replication_queue
  `,
  }),

  'replication-summary-table': () => ({
    query: `
    SELECT (database || '.' || table) as table,
           type,
           countIf(is_currently_executing) AS current_executing,
           COUNT() as total
    FROM system.replication_queue
    GROUP BY 1, 2
    ORDER BY total DESC
  `,
  }),

  'readonly-replica': ({
    interval = 'toStartOfFifteenMinutes',
    lastHours = 24,
  }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           MAX(CurrentMetric_ReadonlyReplica) AS ReadonlyReplica
    FROM merge(system, '^metric_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `,
  }),

  'zookeeper-requests': ({
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
  }) => ({
    query: `
    SELECT
      ${applyInterval(interval, 'event_time')},
      SUM(CurrentMetric_ZooKeeperRequest) AS ZookeeperRequests,
      formatReadableQuantity(ZookeeperRequests) AS readable_ZookeeperRequests,
      SUM(CurrentMetric_ZooKeeperWatch) AS ZooKeeperWatch,
      formatReadableQuantity(ZooKeeperWatch) AS readable_ZooKeeperWatch
    FROM merge(system, '^metric_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `,
  }),

  'zookeeper-exception': ({
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
  }) => ({
    query: `
    SELECT
      ${applyInterval(interval, 'event_time')},
      sum(value) AS KEEPER_EXCEPTION
    FROM merge(system, '^error_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
      AND error = 'KEEPER_EXCEPTION'
    GROUP BY event_time
    ORDER BY event_time WITH FILL TO now() STEP ${fillStep(interval)}
  `,
    optional: true,
    tableCheck: 'system.error_log',
  }),

  'zookeeper-uptime': () => ({
    query: 'SELECT formatReadableTimeDelta(zookeeperSessionUptime()) AS uptime',
  }),

  'zookeeper-wait': ({ interval = 'toStartOfHour', lastHours = 24 * 7 }) => ({
    query: `
    SELECT
      ${applyInterval(interval, 'event_time')},
      AVG(ProfileEvent_ZooKeeperWaitMicroseconds) / 1000000 AS AVG_ProfileEvent_ZooKeeperWaitSeconds,
      formatReadableTimeDelta(AVG_ProfileEvent_ZooKeeperWaitSeconds) AS readable_AVG_ProfileEvent_ZooKeeperWaitSeconds
    FROM merge(system, '^metric_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `,
  }),

  'zookeeper-summary-table': () => ({
    query: `
    SELECT metric, value, description
    FROM system.metrics
    WHERE metric LIKE 'ZooKeeper%'
  `,
  }),

  'page-view': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => {
    const eventTimeExpr = applyInterval(interval, 'event_time', 'event_time')
    return {
      query: `
    SELECT ${eventTimeExpr},
           count() AS page_views
    FROM system.monitoring_events
    WHERE kind = 'PageView'
      AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
      optional: true,
      tableCheck: 'system.monitoring_events',
    }
  },

  'summary-used-by-running-queries': () => ({
    query: `
    SELECT COUNT() as query_count,
           SUM(memory_usage) as memory_usage,
           formatReadableSize(memory_usage) as readable_memory_usage
    FROM system.processes
  `,
  }),

  'summary-used-by-merges': () => ({
    query: `
    SELECT
      SUM(memory_usage) as memory_usage,
      formatReadableSize(memory_usage) as readable_memory_usage
    FROM system.merges
  `,
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

/**
 * Get a chart query by name with optional parameters
 */
export function getChartQuery(
  chartName: string,
  params: ChartQueryParams = {}
): ChartQueryResult | null {
  const builder = chartRegistry[chartName]
  if (!builder) {
    return null
  }

  return builder(params)
}

/**
 * Get all available chart names
 */
export function getAvailableCharts(): string[] {
  return Object.keys(chartRegistry)
}

/**
 * Check if a chart exists in the registry
 */
export function hasChart(chartName: string): boolean {
  return chartName in chartRegistry
}
