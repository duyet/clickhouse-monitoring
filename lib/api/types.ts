/**
 * API types and interfaces for the ClickHouse monitoring API layer.
 * Provides type safety for requests, responses, and error handling.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  SECURITY WARNING: INTERNAL TOOL ONLY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This is an internal monitoring dashboard for ClickHouse database administration.
 * API responses INCLUDE SENSITIVE INFORMATION such as:
 *   - Raw SQL queries executed against the database
 *   - Query parameters and database structure
 *   - Host connection details and version information
 *   - Table names, schemas, and data patterns
 *
 * ⚠️  DO NOT expose this dashboard to PUBLIC INTERNET without proper security:
 *   1. Implement AUTHENTICATION (OAuth, SSO, API keys, etc.)
 *   2. Implement AUTHORIZATION (role-based access control)
 *   3. Use VPN/PRIVATE NETWORK for internal access only
 *   4. Enable AUDIT LOGGING for all access
 *   5. Consider IP whitelisting for trusted networks only
 *
 * The SQL and metadata in responses are intentionally exposed to help DB admins
 * debug and investigate issues by copying queries to ClickHouse client.
 * ═══════════════════════════════════════════════════════════════════════════════
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
 *
 * Details can include primitive values (string, number, boolean) and arrays
 * of primitives for compatibility with FetchDataError structure.
 */
export interface ApiError {
  /** Type of error that occurred */
  readonly type: ApiErrorType
  /** Human-readable error message */
  readonly message: string
  /** Additional error details for debugging */
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

/**
 * Data availability status for ClickHouse queries
 * Provides context about why data may be empty or unavailable
 */
export type DataStatus =
  | 'ok' // Data returned successfully
  | 'empty' // Query succeeded but returned no data
  | 'table_not_configured' // Required log table (metric_log, etc.) is not configured
  | 'table_not_found' // Required table does not exist
  | 'table_empty' // Table exists but contains no data

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
  /** Detected ClickHouse version (e.g., "24.3.1.1") */
  readonly clickhouseVersion?: string
  /** Timestamp when the response was cached (if applicable) */
  readonly cachedAt?: number
  /** Data availability status with context about empty results */
  readonly status?: DataStatus
  /** Human-readable message explaining data status */
  readonly statusMessage?: string
  /** Tables that were checked for existence */
  readonly checkedTables?: readonly string[]
  /** Tables that were found to be missing */
  readonly missingTables?: readonly string[]
  /** Full API endpoint URL that was called (including query params) */
  readonly api?: string
  /** Security warning about exposing sensitive data */
  readonly securityNote?: string
  /** Table/query configuration name */
  readonly table?: string
  /** Raw SQL query that was executed */
  readonly sql?: string
  /** Query parameters that were substituted in the SQL */
  readonly params?: Record<string, unknown> | null
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
