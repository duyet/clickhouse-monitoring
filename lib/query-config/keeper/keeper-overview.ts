import type { QueryConfig } from '@/types/query-config'

import { keeperInfoConfig } from './keeper-info'

/**
 * Keeper Overview page config.
 *
 * Reuses the system.zookeeper_info query (per-node health table) and attaches
 * the Keeper monitoring chart grid as relatedCharts. All charts are individually
 * resilient: the metric_log-backed ones render empty when that log is disabled,
 * and the optional-table charts (connection events) degrade gracefully.
 */
export const keeperOverviewConfig: QueryConfig = {
  ...keeperInfoConfig,
  name: 'keeper-overview',
  description:
    'Keeper/ZooKeeper health overview: liveness, request load, latency, and per-node cluster state.',
  relatedCharts: [
    [
      'zookeeper-requests',
      {
        title: 'Requests & Watches',
        interval: 'toStartOfHour',
        lastHours: 24 * 7,
      },
    ],
    ['keeper-bytes', { title: 'Network Throughput' }],
    'break',
    ['zookeeper-wait', { title: 'Request Wait Time' }],
    ['keeper-connection-events', { title: 'Connection Events' }],
    'break',
    ['keeper-operation-mix', { title: 'Operation Mix' }],
    ['zookeeper-exception', { title: 'Keeper Exceptions' }],
  ],
}
