/**
 * ClickHouse Client Module
 *
 * This file now serves as a central re-export point for all ClickHouse-related modules.
 * The ClickHouse client functionality has been split into domain modules for better organization:
 *
 * - types: Shared types for ClickHouse client and data fetching
 * - connection-pool: Connection pooling and management
 * - clickhouse-config: Configuration parsing from environment variables
 * - clickhouse-client: Client factory with auto-detection for Cloudflare Workers
 * - clickhouse-fetch: Main fetchData function with comprehensive error handling
 * - constants: Shared constants like query comments and timeouts
 */

// Re-export client factory
export {
  getClient,
  getConnectionPoolStats,
  isCloudflareWorkers,
} from './clickhouse/clickhouse-client'
// Re-export configuration functions
export {
  getClickHouseConfigs,
  getClickHouseHosts,
} from './clickhouse/clickhouse-config'
// Re-export data fetching functions
export {
  fetchData,
  query,
} from './clickhouse/clickhouse-fetch'
// Re-export connection pool utilities (if needed externally)
export type { PooledClient } from './clickhouse/connection-pool'
export {
  cleanupStaleClients,
  getPooledClient,
  getPoolKey,
} from './clickhouse/connection-pool'
// Re-export constants
export {
  DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME,
  QUERY_COMMENT,
} from './clickhouse/constants'
// Re-export all types
export type {
  ClickHouseConfig,
  FetchDataError,
  FetchDataErrorType,
  FetchDataResult,
} from './clickhouse/types'
