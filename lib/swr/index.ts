/**
 * SWR Hooks Infrastructure
 * Provides client-side data fetching and caching hooks for the ClickHouse monitoring dashboard
 */

// SWR configuration presets
export { createPollingConfig, REFRESH_INTERVAL, swrConfig } from './config'

// Host context for static page generation
export {
  HostProvider,
  useHostContext,
  useHostIdFromContext,
} from './host-context'

export { SWRProvider } from './provider'
export {
  type StaleError,
  type UseChartResult,
  useChartData,
} from './use-chart-data'
export { useActions } from './use-actions'
export { useFetchData } from './use-fetch-data'
export { useHostId } from './use-host'
export {
  revalidateAllData,
  revalidateByPattern,
  revalidateCharts,
  revalidateTables,
} from './revalidate'
export { useTableData } from './use-table-data'
