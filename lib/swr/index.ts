/**
 * SWR Hooks Infrastructure
 * Provides client-side data fetching and caching hooks for the ClickHouse monitoring dashboard
 */

export type { CachePattern } from './cache-utils'
export type { RefreshInterval } from './config'
export type {
  PerformanceStats,
  RequestMetrics,
} from './use-performance-metrics'
export type { TableDataResponse, TableQueryParams } from './use-table-data'

// Cache utilities
export {
  CachePatterns,
  createOptimisticUpdate,
  useCacheUtils,
} from './cache-utils'
// SWR configuration presets
export { createPollingConfig, REFRESH_INTERVAL, swrConfig } from './config'
// Host context for static page generation
export {
  HostProvider,
  useHostContext,
  useHostIdFromContext,
} from './host-context'
// SWR Provider with adaptive polling
export { SWRProvider } from './provider'
// Cache revalidation utilities
export {
  revalidateAllData,
  revalidateByPattern,
  revalidateCharts,
  revalidateTables,
} from './revalidate'
// Action hooks
export { useActions } from './use-actions'
export {
  AdaptivePollingProvider,
  getAdaptiveInterval,
  useAdaptiveInterval,
  useAdaptivePolling,
} from './use-adaptive-polling'
// Chart data fetching with adaptive polling
export {
  type StaleError,
  type UseChartResult,
  useChartData,
} from './use-chart-data'
// Other hooks
export { useFetchData } from './use-fetch-data'
export { useHostId } from './use-host'
export {
  type OverviewData,
  type UseOverviewDataOptions,
  type UseOverviewDataResult,
  useOverviewData,
} from './use-overview-data'
// Performance monitoring
export {
  globalMetrics,
  usePerformanceMetrics,
  useTrackedFetcher,
} from './use-performance-metrics'
// Table data fetching with adaptive polling
export { useTableData } from './use-table-data'
