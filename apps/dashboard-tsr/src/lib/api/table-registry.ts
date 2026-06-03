/**
 * Table/query-config registry for dashboard-tsr.
 *
 * Ported from apps/dashboard/lib/api/table-registry.ts. Maps a config `name`
 * to its QueryConfig and resolves a runnable query (SQL + params) from URL
 * search params.
 *
 * Foundation simplifications:
 * - The source list is `queries` from `@/lib/query-config` (empty until the
 *   54 configs are ported). `registerTableConfig` lets ported modules add
 *   configs without editing this file.
 * - The dashboard's schema-driven `filterSchema` WHERE-clause injection
 *   (filters/url-state + filters/where-builder) is DEFERRED — those modules
 *   are not ported. Until then, params come from defaultParams + raw search
 *   params, exactly like the dashboard's non-filterSchema branch.
 */

import type { QueryConfig } from '@/lib/query-config'

import { getSqlForDisplay, queries } from '@/lib/query-config'

/** Params for building a table query. */
export interface TableQueryParams {
  /** Host id to run against. */
  hostId: number | string
  /** URL search params (filters + query params), minus hostId. */
  searchParams?: Record<string, string>
}

/** Result of resolving a table query. */
export interface TableQueryResult {
  /** SQL string for display; execution re-selects the versioned SQL. */
  query: string
  /** Params to substitute (`{name:Type}`). */
  queryParams?: Record<string, unknown>
  /** The resolved config (passed to the executor for version selection). */
  queryConfig: QueryConfig
}

/**
 * Lazy registry seeded from `queries`. Ported domain modules can also call
 * `registerTableConfig` at import time to add configs not in the aggregate.
 */
const tableRegistry = new Map<string, QueryConfig>(
  queries.map((config) => [config.name, config])
)

/** Register one config (overwrites by name). */
export function registerTableConfig(config: QueryConfig): void {
  tableRegistry.set(config.name, config)
}

/** Register many configs at once. */
export function registerTableConfigs(configs: QueryConfig[]): void {
  for (const config of configs) tableRegistry.set(config.name, config)
}

/**
 * Resolve a runnable table query from a config name + URL search params.
 * Returns null if the name is unknown.
 */
export function getTableQuery(
  name: string,
  params: TableQueryParams
): TableQueryResult | null {
  const queryConfig = tableRegistry.get(name)
  if (!queryConfig) return null

  // Start from the config's default params, then layer URL search params.
  const queryParams: Record<string, unknown> = {
    ...(queryConfig.defaultParams ?? {}),
  }
  if (params.searchParams) Object.assign(queryParams, params.searchParams)

  return {
    // Display string; the executor calls selectVersionedSql for execution.
    query: getSqlForDisplay(queryConfig.sql),
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    queryConfig,
  }
}

/** Does a table config exist? */
export function hasTable(name: string): boolean {
  return tableRegistry.has(name)
}

/** All registered config names, sorted. */
export function getAvailableTables(): string[] {
  return Array.from(tableRegistry.keys()).sort()
}

/** Get a raw config by name. */
export function getTableConfig(name: string): QueryConfig | undefined {
  return tableRegistry.get(name)
}
