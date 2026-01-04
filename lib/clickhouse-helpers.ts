import type { DataFormat, QueryParams } from '@clickhouse/client'

import type { QueryConfig } from '@/types/query-config'

import { type FetchDataResult, fetchData } from '@/lib/clickhouse'
import { ErrorLogger } from '@/lib/logger'

export { type FetchDataResult, fetchData } from '@/lib/clickhouse'

type QuerySettings = QueryParams['clickhouse_settings'] &
  Partial<{
    query_cache_system_table_handling: 'throw' | 'save' | 'ignore'
    query_cache_nondeterministic_function_handling: 'throw' | 'save' | 'ignore'
  }>

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
  hostId = 0,
}: Omit<QueryParams, 'format'> & {
  format?: DataFormat
  clickhouse_settings?: QuerySettings
  queryConfig?: QueryConfig
  hostId?: number | string
}): Promise<FetchDataResult<T>> {
  try {
    const finalHostId = validateHostId(hostId)

    return await fetchData<T>({
      query,
      query_params,
      format,
      clickhouse_settings,
      queryConfig,
      hostId: finalHostId,
    })
  } catch (error) {
    ErrorLogger.logError(error as Error, { component: 'fetchDataWithHost' })

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

export function validateHostId(hostId: unknown): number {
  if (hostId === undefined || hostId === null) {
    return 0
  }

  if (typeof hostId === 'string') {
    if (!/^\d+$/.test(hostId.trim())) {
      ErrorLogger.logWarning(`Invalid hostId: ${hostId}`, {
        component: 'validateHostId',
      })
      return 0
    }
    const parsed = parseInt(hostId, 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      ErrorLogger.logWarning(`Invalid hostId: ${hostId}`, {
        component: 'validateHostId',
      })
      return 0
    }
    return parsed
  }

  if (typeof hostId === 'number') {
    if (hostId < 0 || !Number.isInteger(hostId)) {
      ErrorLogger.logWarning(`Invalid hostId: ${hostId}`, {
        component: 'validateHostId',
      })
      return 0
    }
    return hostId
  }

  return 0
}
