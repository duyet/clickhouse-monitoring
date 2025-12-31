import { cache } from 'react'
import type { QueryConfig } from '@/types/query-config'

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
import { queryDetailConfig } from './queries/query-detail'
import { runningQueriesConfig } from './queries/running-queries'
import { clustersConfig } from './system/clusters'
import {
  databaseTableColumnsConfig,
  tablesListConfig,
} from './system/database-table'
import {
  databaseDiskSpaceByDatabaseConfig,
  databaseDiskSpaceConfig,
  diskSpaceConfig,
} from './system/disks'
import {
  clustersReplicasStatusConfig,
  replicaTablesConfig,
} from './system/replicas-status'
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
  queryDetailConfig,
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

  // System
  clustersConfig,
  clustersReplicasStatusConfig,
  replicaTablesConfig,
  diskSpaceConfig,
  databaseDiskSpaceConfig,
  databaseDiskSpaceByDatabaseConfig,
  databaseTableColumnsConfig,
  tablesListConfig,
]

export const getQueryConfigByName = cache(
  (name: string): QueryConfig | undefined | null => {
    if (!name) {
      return null
    }

    return queries.find((q) => q.name === name)
  }
)
