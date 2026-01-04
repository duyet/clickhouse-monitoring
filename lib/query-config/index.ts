import type { QueryConfig } from '@/types/query-config'

import {
  explorerColumnsConfig,
  explorerDatabasesConfig,
  explorerDdlConfig,
  explorerIndexesConfig,
  explorerTablesConfig,
} from './explorer'
import { crashLogConfig } from './logs/crashes'
import { stackTracesConfig } from './logs/stack-traces'
// Logs
import { textLogConfig } from './logs/text-log'
import { mergePerformanceConfig } from './merges/merge-performance'
import { mergesConfig } from './merges/merges'
import { mutationsConfig } from './merges/mutations'
import { asynchronousMetricsConfig } from './more/asynchronous-metrics'
import { backupsConfig } from './more/backups'
import { dictionariesConfig } from './more/dictionaries'
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
import { parallelizationConfig } from './queries/parallelization'
import { profilerConfig } from './queries/profiler'
import { queryCacheConfig } from './queries/query-cache'
import { queryDetailConfig } from './queries/query-detail'
import { runningQueriesConfig } from './queries/running-queries'
// Thread Analysis
import { threadAnalysisConfig } from './queries/thread-analysis'
import { loginAttemptsConfig } from './security/login-attempts'
// Security
import { sessionsConfig } from './security/sessions'
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
import { partInfoConfig } from './tables/part-info'
import { projectionsConfig } from './tables/projections'
import { readOnlyTablesConfig } from './tables/readonly-tables'
import { replicasConfig } from './tables/replicas'
import { replicationQueueConfig } from './tables/replication-queue'
import { tablesOverviewConfig } from './tables/tables-overview'
import { viewRefreshesConfig } from './tables/view-refreshes'
import { cache } from 'react'

export const queries: Array<QueryConfig> = [
  // Explorer
  explorerDatabasesConfig,
  explorerTablesConfig,
  explorerColumnsConfig,
  explorerDdlConfig,
  explorerIndexesConfig,

  // Tables
  tablesOverviewConfig,
  distributedDdlQueueConfig,
  replicasConfig,
  replicationQueueConfig,
  readOnlyTablesConfig,
  detachedPartsConfig,
  partInfoConfig,
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

  // Security
  sessionsConfig,
  loginAttemptsConfig,

  // Logs
  textLogConfig,
  stackTracesConfig,
  crashLogConfig,

  // Thread Analysis
  threadAnalysisConfig,
  parallelizationConfig,
  profilerConfig,

  // Dictionaries
  dictionariesConfig,
]

export const getQueryConfigByName = cache(
  (name: string): QueryConfig | undefined | null => {
    if (!name) {
      return null
    }

    return queries.find((q) => q.name === name)
  }
)
