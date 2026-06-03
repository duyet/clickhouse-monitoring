/**
 * API types for the ClickHouse monitoring API layer (ported from the Next app,
 * apps/dashboard/lib/api/types.ts — pure types, framework-agnostic).
 *
 * Internal tool: API responses include sensitive info (raw SQL, host/version).
 * Do not expose publicly without auth/authorization.
 */

export enum ApiErrorType {
  TableNotFound = 'table_not_found',
  ValidationError = 'validation_error',
  QueryError = 'query_error',
  NetworkError = 'network_error',
  PermissionError = 'permission_error',
  SslError = 'ssl_error',
  TimeoutError = 'timeout_error',
}

export interface ApiError {
  readonly type: ApiErrorType
  readonly message: string
  readonly details?: {
    readonly [key: string]:
      | string
      | number
      | boolean
      | undefined
      | readonly string[]
      | readonly (string | number | boolean)[]
  }
}

export type DataStatus =
  | 'ok'
  | 'empty'
  | 'table_not_configured'
  | 'table_not_found'
  | 'table_empty'

export interface ApiResponseMetadata {
  readonly queryId: string
  readonly duration: number
  readonly rows: number
  readonly host: string
  readonly clickhouseVersion?: string
  readonly cachedAt?: number
  readonly status?: DataStatus
  readonly statusMessage?: string
  readonly checkedTables?: readonly string[]
  readonly missingTables?: readonly string[]
  readonly api?: string
  readonly securityNote?: string
  readonly table?: string
  readonly sql?: string
  readonly params?: Record<string, unknown> | null
  readonly timezone?: string
  readonly resultRowLimit?: number
  readonly resultOverflowMode?: string
  readonly resultRowsBeforeCap?: number
  readonly resultRowsTruncated?: boolean
}

export interface ApiResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly metadata: ApiResponseMetadata
  readonly error?: ApiError
}

export interface ApiRequest {
  readonly query: string
  readonly queryParams?: Record<string, string | number | boolean>
  readonly hostId: string
  readonly format?: 'JSONEachRow' | 'JSON' | 'CSV' | 'TSV'
  readonly queryConfigName?: string
  readonly timezone?: string
}
