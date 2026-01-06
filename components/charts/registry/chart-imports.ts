/**
 * Chart Imports
 *
 * Central registry for all lazy-loaded chart component imports organized by category.
 * This file centralizes the lazy imports to eliminate duplication across the codebase.
 *
 * Charts are organized by category:
 * - query/      - Query-related charts
 * - merge/      - Merge operation charts
 * - system/     - System metrics
 * - replication/ - Replication charts
 * - zookeeper/  - ZooKeeper charts
 * - logs/       - Logging and error tracking charts
 * - threads/    - Thread performance charts
 * - misc/       - Miscellaneous charts
 *
 * Note: Overview charts (database-table-count, running-queries) are server components
 * and are not compatible with the client-side chart registry pattern.
 * They must be imported directly in server components.
 */

import type { ChartRegistryMap } from './types'

import { logsChartImports } from './imports/logs-charts'
import { mergeChartImports } from './imports/merge-charts'
import { miscChartImports } from './imports/misc-charts'
import { queryChartImports } from './imports/query-charts'
import { replicationChartImports } from './imports/replication-charts'
import { systemChartImports } from './imports/system-charts'
import { threadChartImports } from './imports/thread-charts'
import { zookeeperChartImports } from './imports/zookeeper-charts'

/**
 * Combine all chart imports into a single registry
 */
export const chartImports: ChartRegistryMap = {
  ...queryChartImports,
  ...mergeChartImports,
  ...systemChartImports,
  ...replicationChartImports,
  ...zookeeperChartImports,
  ...logsChartImports,
  ...threadChartImports,
  ...miscChartImports,
}
