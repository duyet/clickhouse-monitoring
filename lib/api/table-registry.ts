/**
 * Table registry that maps table/query config names to their query builders
 * Provides centralized access to all available table queries and their SQL definitions
 */

import { queries } from '@/app/[host]/[query]/clickhouse-queries'
import { queryConfig as clustersConfig } from '@/app/[host]/clusters/config'
import { queryConfig as clustersReplicasStatusConfig } from '@/app/[host]/clusters/[cluster]/replicas-status/config'
import {
  diskSpaceConfig,
  databaseDiskSpaceConfig,
  databaseDiskSpaceByDatabaseConfig,
} from '@/app/[host]/disks/config'
import { queryConfig as databaseTableColumnsConfig } from '@/app/[host]/database/[database]/[table]/config'
import { queryConfig as replicaTablesConfig } from '@/app/[host]/replica/[replica]/tables/config'
import type { QueryConfig } from '@/types/query-config'

/**
 * Parameters for building table queries
 */
export interface TableQueryParams {
  /** Host identifier to execute query against */
  hostId: number | string
  /** URL search parameters containing filters and query parameters */
  searchParams?: Record<string, string>
}

/**
 * Result of building a table query
 */
export interface TableQueryResult {
  /** The SQL query to execute */
  query: string
  /** Parameters to substitute in the query */
  queryParams?: Record<string, unknown>
  /** The original query configuration */
  queryConfig: QueryConfig
}

/**
 * Merge all query configs from different sources into a single registry
 */
const allQueryConfigs: QueryConfig[] = [
  // Main queries from clickhouse-queries.ts
  ...queries,

  // Specific page configs
  clustersConfig,
  clustersReplicasStatusConfig,
  diskSpaceConfig,
  databaseDiskSpaceConfig,
  databaseDiskSpaceByDatabaseConfig,
  databaseTableColumnsConfig,
  replicaTablesConfig,
]

/**
 * Registry mapping query config names to their configurations
 */
const tableRegistry: Map<string, QueryConfig> = new Map(
  allQueryConfigs.map((config) => [config.name, config])
)

/**
 * Build a table query with parameters from URL search params
 *
 * This function takes a query config and injects parameters from the URL search params.
 * Parameters can be specified in the SQL using ClickHouse parameter syntax:
 * {paramName:Type}
 *
 * Example SQL:
 * ```sql
 * SELECT * FROM system.tables WHERE database = {database:String}
 * ```
 *
 * With searchParams: { database: 'default' }
 * Result queryParams: { database: 'default' }
 *
 * @param name - Name of the query configuration
 * @param params - Query parameters including hostId and searchParams
 * @returns Query result with SQL and parameters, or null if not found
 */
export function getTableQuery(
  name: string,
  params: TableQueryParams
): TableQueryResult | null {
  const queryConfig = tableRegistry.get(name)
  if (!queryConfig) {
    return null
  }

  // Start with default params from the config
  const queryParams: Record<string, unknown> = {
    ...(queryConfig.defaultParams || {}),
  }

  // Merge in search params if provided
  if (params.searchParams) {
    Object.assign(queryParams, params.searchParams)
  }

  return {
    query: queryConfig.sql,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    queryConfig,
  }
}

/**
 * Check if a table query exists in the registry
 *
 * @param name - Name of the query configuration
 * @returns True if the query exists
 */
export function hasTable(name: string): boolean {
  return tableRegistry.has(name)
}

/**
 * Get all available table query names
 *
 * @returns Array of all available query config names
 */
export function getAvailableTables(): string[] {
  return Array.from(tableRegistry.keys()).sort()
}

/**
 * Get a query config by name
 *
 * @param name - Name of the query configuration
 * @returns The query configuration, or undefined if not found
 */
export function getTableConfig(name: string): QueryConfig | undefined {
  return tableRegistry.get(name)
}
