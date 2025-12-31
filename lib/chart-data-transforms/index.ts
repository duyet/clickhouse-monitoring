/**
 * Chart data transformation utilities.
 *
 * This module provides a unified export interface for all chart data
 * transformation functions. Functions are organized by domain:
 *
 * - User events: transformUserEventCounts
 * - Merge data: transformMergeSummaryData
 * - Running queries: transformRunningQueriesSummaryData
 * - Common helpers: extractNestedData, formatReadWritePair
 *
 * @example
 * ```ts
 * import { transformUserEventCounts } from '@/lib/chart-data-transforms'
 * // or
 * import { transformMergeSummaryData, extractNestedData } from '@/lib/chart-data-transforms'
 * ```
 */

// User event transformations
export { transformUserEventCounts } from './transforms/user-events'
export type { UserEventCountsTransformed, UserEventCountItem } from './types'

// Merge data transformations
export { transformMergeSummaryData } from './transforms/merge-data'

// Running query transformations
export { transformRunningQueriesSummaryData } from './transforms/running-queries'

// Common helpers
export { extractNestedData, formatReadWritePair } from './transforms/common'

// Shared types
export type {
  MemoryUsageData,
  TotalMemData,
  RowsReadWrittenData,
  BytesReadWrittenData,
  QueryCountData,
  SummaryMetricsItem,
  SummaryInputData,
  SummaryDataTransformed,
  ReadWritePair,
} from './types'
