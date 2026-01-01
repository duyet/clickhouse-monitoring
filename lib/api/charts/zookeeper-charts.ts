/**
 * ZooKeeper Charts
 * Charts for tracking ZooKeeper/ClickHouse Keeper metrics
 */

import type { ChartQueryBuilder } from './types'

import { applyInterval, fillStep } from './types'

export const zookeeperCharts: Record<string, ChartQueryBuilder> = {
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
    FROM merge('system', '^metric_log')
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
    FROM merge('system', '^error_log')
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
    FROM merge('system', '^metric_log')
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
}
