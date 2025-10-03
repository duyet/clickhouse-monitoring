/**
 * @fileoverview Helper functions for ClickHouse operations
 * Provides wrapper functions to reduce boilerplate and improve consistency
 */

import { fetchData, type FetchDataResult } from '@/lib/clickhouse'
import { getHostIdCookie } from '@/lib/scoped-link'
import type { QueryConfig } from '@/types/query-config'
import type { DataFormat, QueryParams } from '@clickhouse/client'

// Re-export fetchData for direct use
export { fetchData, type FetchDataResult } from '@/lib/clickhouse'

type QuerySettings = QueryParams['clickhouse_settings'] &
  Partial<{
    // @since 24.4
    query_cache_system_table_handling: 'throw' | 'save' | 'ignore'
    query_cache_nondeterministic_function_handling: 'throw' | 'save' | 'ignore'
  }>

/**
 * Wrapper function for fetchData that automatically handles hostId
 * This reduces boilerplate across components and ensures consistent host handling
 *
 * @param params - Query parameters (same as fetchData but hostId is optional)
 * @param hostId - Optional hostId override (useful for pages that get it from params)
 * @returns Promise with query results
 */
export async function fetchDataWithHost<
  T extends
    | unknown[]
    | object[]
    | Record<string, unknown>
    | { length: number; rows: number; statistics: Record<string, unknown> },
>({
  query,
  query_params,
  format = 'JSONEachRow' as DataFormat,
  clickhouse_settings,
  queryConfig,
  hostId,
}: Omit<QueryParams, 'format'> & {
  format?: DataFormat
  clickhouse_settings?: QuerySettings
  queryConfig?: QueryConfig
  hostId?: number | string
}): Promise<FetchDataResult<T>> {
  try {
    // If hostId is not provided, get it from cookie
    let finalHostId = hostId

    if (finalHostId === undefined || finalHostId === null) {
      // Get hostId from cookie with proper error handling
      try {
        finalHostId = await getHostIdCookie(0)
      } catch (error) {
        console.warn(
          'Failed to get hostId from cookie, using default 0:',
          error
        )
        finalHostId = 0
      }
    }

    // Validate hostId using the helper function
    finalHostId = validateHostId(finalHostId)

    // Call the original fetchData with the resolved hostId
    return await fetchData<T>({
      query,
      query_params,
      format,
      clickhouse_settings,
      queryConfig,
      hostId: finalHostId,
    })
  } catch (error) {
    console.error('Error in fetchDataWithHost:', error)

    // Return a properly typed error result
    return {
      data: null,
      metadata: {
        queryId: '',
        duration: 0,
        rows: 0,
        host: 'unknown',
      },
      error: {
        type: 'query_error',
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
        details: {
          originalError:
            error instanceof Error ? error : new Error(String(error)),
        },
      },
    }
  }
}

/**
 * Helper to validate and normalize hostId
 * @param hostId - The hostId to validate
 * @returns Validated and normalized hostId
 */
export function validateHostId(hostId: unknown): number {
  if (hostId === undefined || hostId === null) {
    return 0
  }

  if (typeof hostId === 'string') {
    // Check if string contains only digits (no decimals, no other characters)
    if (!/^\d+$/.test(hostId.trim())) {
      console.warn(`Invalid hostId: ${hostId}`)
      return 0
    }
    const parsed = parseInt(hostId, 10)
    if (isNaN(parsed) || parsed < 0) {
      console.warn(`Invalid hostId: ${hostId}`)
      return 0
    }
    return parsed
  }

  if (typeof hostId === 'number') {
    if (hostId < 0 || !Number.isInteger(hostId)) {
      console.warn(`Invalid hostId: ${hostId}`)
      return 0
    }
    return hostId
  }

  return 0
}
