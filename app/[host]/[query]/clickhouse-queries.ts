import type { QueryConfig } from '@/types/query-config'
import { cache } from 'react'

import { mergePerformanceConfig } from './merges/merge-performance'
import { mergesConfig } from './merges/merges'
import { mutationsConfig } from './merges/mutations'
import { asynchronousMetricsConfig } from './more/asynchronous-metrics'
import { backupsConfig } from './more/backups'
import { errorsConfig } from './more/errors'
import { mergeTreeSettingsConfig } from './more/mergetree-settings'
import { metricsConfig } from './more/metrics'
import { pageViewsConfig } from './more/page-views'
import { rolesConfig } from './more/roles'
import { settingsConfig } from './more/settings'
import { topUsageColumnsConfig } from './more/top-usage-columns'
import { topUsageTablesConfig } from './more/top-usage-tables'
import { usersConfig } from './more/users'
import { zookeeperConfig } from './more/zookeeper'
import { commonErrorsConfig } from './queries/common-errors'
import { expensiveQueriesConfig } from './queries/expensive-queries'
import { expensiveQueriesByMemoryConfig } from './queries/expensive-queries-by-memory'
import { failedQueriesConfig } from './queries/failed-queries'
import { historyQueriesConfig } from './queries/history-queries'
import { queryCacheConfig } from './queries/query-cache'
import { runningQueriesConfig } from './queries/running-queries'
import { detachedPartsConfig } from './tables/detached-parts'
import { distributedDdlQueueConfig } from './tables/distributed-ddl-queue'
import { projectionsConfig } from './tables/projections'
import { readOnlyTablesConfig } from './tables/readonly-tables'
import { replicasConfig } from './tables/replicas'
import { replicationQueueConfig } from './tables/replication-queue'
import { tablesOverviewConfig } from './tables/tables-overview'
import { viewRefreshesConfig } from './tables/view-refreshes'

export const queries: Array<QueryConfig> = [
  // Tables
  tablesOverviewConfig,
  distributedDdlQueueConfig,
  replicasConfig,
  replicationQueueConfig,
  readOnlyTablesConfig,
  detachedPartsConfig,
  projectionsConfig,
  viewRefreshesConfig,

  // Queries
  queryCacheConfig,
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

  // Top Usage
  topUsageTablesConfig,
  topUsageColumnsConfig,

  // More
  backupsConfig,
  metricsConfig,
  asynchronousMetricsConfig,
  usersConfig,
  rolesConfig,
  zookeeperConfig,
  errorsConfig,
  pageViewsConfig,
]

export const getQueryConfigByName = cache(
  (name: string): QueryConfig | undefined | null => {
    if (!name) {
      return null
    }

    return queries.find((q) => q.name === name)
  }
)
