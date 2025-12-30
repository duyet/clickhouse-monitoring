/**
 * ClickHouse Client Types
 * Shared types for ClickHouse client and data fetching
 */

import type { QueryParams } from '@clickhouse/client'

export type ClickHouseConfig = {
  id: number
  host: string
  user: string
  password: string
  customName?: string
}

/** @deprecated Reserved for future use */
type _QuerySettings = QueryParams['clickhouse_settings'] &
  Partial<{
    // @since 24.4
    query_cache_system_table_handling: 'throw' | 'save' | 'ignore'
    query_cache_nondeterministic_function_handling: 'throw' | 'save' | 'ignore'
  }>

export type FetchDataErrorType =
  | 'table_not_found'
  | 'validation_error'
  | 'query_error'
  | 'network_error'
  | 'permission_error'

export interface FetchDataError {
  readonly type: FetchDataErrorType
  readonly message: string
  readonly details?: {
    readonly missingTables?: readonly string[]
    readonly queryId?: string
    readonly originalError?: Error
    readonly host?: string
  }
}

export interface FetchDataResult<T> {
  readonly data: T | null
  readonly metadata: Record<string, string | number>
  readonly error?: FetchDataError
}
