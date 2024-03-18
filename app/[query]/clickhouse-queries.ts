import { type QueryConfig } from '@/lib/types/query-config'

import { mergePerformanceConfig } from './merges/merge-performance'
import { mergesConfig } from './merges/merges'
import { mutationsConfig } from './merges/mutations'
import { asynchronousMetricsConfig } from './more/asynchronous-metrics'
import { backupsConfig } from './more/backups'
import { disksConfig } from './more/disks'
import { mergeTreeSettingsConfig } from './more/mergetree-settings'
import { metricsConfig } from './more/metrics'
import { replicasConfig } from './more/replicas'
import { replicationQueueConfig } from './more/replication-queue'
import { settingsConfig } from './more/settings'
import { topUsageColumnsConfig } from './more/top-usage-columns'
import { topUsageTablesConfig } from './more/top-usage-tables'
import { commonErrorsConfig } from './queries/common-errors'
import { expensiveQueriesConfig } from './queries/expensive-queries'
import { expensiveQueriesByMemoryConfig } from './queries/expensive-queries-by-memory'
import { failedQueriesConfig } from './queries/failed-queries'
import { historyQueriesConfig } from './queries/history-queries'
import { runningQueriesConfig } from './queries/running-queries'
import { tablesOverviewConfig } from './tables/table-overview'

export const queries: Array<QueryConfig> = [
  // Overview
  tablesOverviewConfig,

  // Queries
  runningQueriesConfig,
  historyQueriesConfig,
  failedQueriesConfig,
  commonErrorsConfig,
  expensiveQueriesConfig,
  expensiveQueriesByMemoryConfig,

  // Merges
  mergesConfig,
  mergePerformanceConfig,
  mutationsConfig,

  // Settings
  settingsConfig,
  mergeTreeSettingsConfig,
  disksConfig,

  // Top Usage
  topUsageTablesConfig,
  topUsageColumnsConfig,

  // More
  backupsConfig,
  replicasConfig,
  replicationQueueConfig,
  metricsConfig,
  asynchronousMetricsConfig,
]

export const getQueryConfigByName = (
  name: string
): QueryConfig | undefined | null => {
  if (!name) {
    return null
  }

  return queries.find((q) => q.name === name)
}
