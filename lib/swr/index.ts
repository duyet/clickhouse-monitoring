/**
 * SWR Hooks Infrastructure
 * Provides client-side data fetching and caching hooks for the ClickHouse monitoring dashboard
 */

// SWR configuration presets
export { createPollingConfig, REFRESH_INTERVAL, swrConfig } from './config'
export { SWRProvider } from './provider'
export {
  type StaleError,
  type UseChartResult,
  useChartData,
} from './use-chart-data'
export { useFetchData } from './use-fetch-data'
export { useHostId } from './use-host'
export { useTableData } from './use-table-data'
