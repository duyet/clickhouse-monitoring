/**
 * Dashboard Query Validator
 *
 * Validates that queries exist in the dashboard tables before execution.
 * This prevents arbitrary SQL execution from clients.
 *
 * Only queries stored in the system.clickhouse_monitoring_custom_dashboard table
 * are allowed to be executed without a queryConfig.
 *
 * @module app/api/v1/data/validators/dashboard-query-validator
 */

import { getCachedDashboardQueries } from '../utils/cache-manager'
import { fetchData } from '@/lib/clickhouse'
import { error } from '@/lib/logger'

/** Dashboard table name for query validation */
export const DASHBOARD_QUERIES_TABLE =
  'system.clickhouse_monitoring_custom_dashboard'

/**
 * Validation result for dashboard queries
 */
export interface DashboardQueryValidationResult {
  readonly valid: boolean
  readonly error?: {
    readonly type: string
    readonly message: string
  }
}

/**
 * Validates that a query exists in the dashboard tables
 * Uses cache to avoid repeated lookups for the same host
 *
 * SECURITY: This prevents execution of arbitrary SQL from clients by only
 * allowing queries that have been pre-registered in the dashboard tables.
 *
 * @param query - The SQL query to validate
 * @param hostId - The host identifier to validate against
 * @returns Validation result with valid flag and optional error
 *
 * @example
 * ```ts
 * const result = await validateDashboardQuery('SELECT count() FROM system.tables', 0)
 * if (!result.valid) {
 *   return createErrorResponse(result.error!, 403)
 * }
 * ```
 */
export async function validateDashboardQuery(
  query: string,
  hostId: number
): Promise<DashboardQueryValidationResult> {
  try {
    // Check cache first to avoid repeated database queries
    const cachedQueries = getCachedDashboardQueries(hostId)
    if (cachedQueries?.has(query)) {
      return { valid: true }
    }

    // Query the dashboard table to verify this query exists
    const result = await fetchData({
      query: `SELECT query FROM ${DASHBOARD_QUERIES_TABLE}`,
      format: 'JSONEachRow',
      hostId,
    })

    if (result.error) {
      // Table doesn't exist or other error - fail closed for security
      error('[Dashboard Query Validation] Error:', result.error)
      return {
        valid: false,
        error: {
          type: 'permission_error',
          message:
            'Query validation failed: dashboard table not accessible. Use /api/v1/charts/[name] or /api/v1/tables/[name] for registry-based queries.',
        },
      }
    }

    // Extract and cache queries
    const queries = new Set<string>()
    for (const row of result.data as Array<{ query: string }>) {
      queries.add(row.query)
    }

    // Update cache with new queries
    const { updateDashboardQueryCache } = await import('../utils/cache-manager')
    updateDashboardQueryCache(hostId, queries)

    // Check if the query exists in the table
    if (!queries.has(query)) {
      return {
        valid: false,
        error: {
          type: 'permission_error',
          message:
            'Query not found in dashboard tables. Use /api/v1/charts/[name] or /api/v1/tables/[name] for registry-based queries.',
        },
      }
    }

    return { valid: true }
  } catch (err) {
    error('[Dashboard Query Validation] Unexpected error:', err)
    return {
      valid: false,
      error: {
        type: 'permission_error',
        message: 'Query validation failed due to an unexpected error',
      },
    }
  }
}
