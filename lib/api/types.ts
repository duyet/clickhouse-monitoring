/**
 * API types and interfaces for the ClickHouse monitoring API layer.
 * Provides type safety for requests, responses, and error handling.
 */

import type { QueryConfig } from '@/types/query-config'

/**
 * Error types that can be returned from the API
 */
export enum ApiErrorType {
  /** Table does not exist in ClickHouse */
  TableNotFound = 'table_not_found',
  /** Request validation failed */
  ValidationError = 'validation_error',
  /** Query execution error */
  QueryError = 'query_error',
  /** Network or connection error */
  NetworkError = 'network_error',
  /** Permission or authentication error */
  PermissionError = 'permission_error',
}

/**
 * Detailed error information returned by the API
 */
export interface ApiError {
  /** Type of error that occurred */
  readonly type: ApiErrorType
  /** Human-readable error message */
  readonly message: string
  /** Additional error details for debugging */
  readonly details?: {
    readonly [key: string]: string | number | boolean | undefined
  }
}

/**
 * Response metadata containing query execution information
 */
export interface ApiResponseMetadata {
  /** Unique identifier for the query execution */
  readonly queryId: string
  /** Query execution duration in milliseconds */
  readonly duration: number
  /** Number of rows returned by the query */
  readonly rows: number
  /** Host that executed the query */
  readonly host: string
  /** Timestamp when the response was cached (if applicable) */
  readonly cachedAt?: number
  /** SQL query that generated this response (read-only display) */
  readonly sql?: string
}

/**
 * Generic API response wrapper with metadata and error handling
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request was successful */
  readonly success: boolean
  /** Response data (only present if success is true) */
  readonly data?: T
  /** Response metadata including query execution info */
  readonly metadata: ApiResponseMetadata
  /** Error information (only present if success is false) */
  readonly error?: ApiError
}

/**
 * Query parameters for ClickHouse query execution
 */
export interface ApiRequest {
  /** The SQL query to execute */
  readonly query: string
  /** Parameters to substitute in the query */
  readonly queryParams?: Record<string, string | number | boolean>
  /** Host identifier to execute query against */
  readonly hostId: string
  /** Data format for query response (default: JSONEachRow) */
  readonly format?: 'JSONEachRow' | 'JSON' | 'CSV' | 'TSV'
  /** Optional query configuration with metadata */
  readonly queryConfig?: QueryConfig
}

/**
 * Request for fetching chart data
 */
export interface ChartDataRequest {
  /** Name/identifier of the chart */
  readonly chartName: string
  /** Host identifier to fetch data from */
  readonly hostId: string
  /** Time interval for data aggregation (e.g., '1m', '1h', '1d') */
  readonly interval?: string
  /** Number of hours of historical data to fetch */
  readonly lastHours?: number
  /** Additional parameters for chart-specific queries */
  readonly params?: Record<string, string | number | boolean>
}

/**
 * Request for fetching table data with filtering and pagination
 */
export interface TableDataRequest {
  /** Name of the query configuration to use */
  readonly queryConfigName: string
  /** Host identifier to fetch data from */
  readonly hostId: string
  /** Search and filter parameters from URL search params */
  readonly searchParams?: Record<string, string | string[]>
}
