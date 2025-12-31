'use client'

import { useMemo } from 'react'
import type { MetricCardProps } from '../types'
import { shouldShowRetryButton } from '@/lib/card-error-utils'

// ============================================================================
// Types
// ============================================================================

export interface UseMetricStateOptions<TData> {
  swr: MetricCardProps<TData>['swr']
}

export interface MetricState<TData> {
  /** Normalized data array (always TData[] | undefined) */
  dataArray: TData[] | undefined
  /** SWR loading state */
  isLoading: boolean
  /** SWR error state */
  error: Error | null | undefined
  /** SWR mutate function for retry */
  mutate?: () => void
  /** Whether data is empty (no data or empty array) */
  isEmpty: boolean
  /** Whether retry button should be shown */
  shouldShowRetry: boolean
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing MetricCard state derived from SWR response.
 * Handles data normalization, derived states, and memoization for performance.
 *
 * @param options - SWR state options
 * @returns Normalized metric state with derived values
 *
 * @example
 * ```tsx
 * const state = useMetricState({ swr: useChartData(...) })
 * if (state.isLoading) return <Skeleton />
 * if (state.error) return <ErrorState />
 * if (state.isEmpty) return <EmptyState />
 * return <DataDisplay data={state.dataArray!} />
 * ```
 */
export function useMetricState<TData = unknown>({
  swr,
}: UseMetricStateOptions<TData>): MetricState<TData> {
  const { data, isLoading, error, mutate } = swr

  // Normalize data to array (memoized to avoid recalculating)
  const dataArray = useMemo<MetricState<TData>['dataArray']>(() => {
    if (Array.isArray(data)) {
      return data
    }
    if (data != null) {
      return [data] as TData[]
    }
    return undefined
  }, [data])

  // Derived: isEmpty state
  const isEmpty = useMemo(() => {
    return !dataArray || dataArray.length === 0
  }, [dataArray])

  // Derived: shouldShowRetry state
  const shouldShowRetry = useMemo(() => {
    return !!error && !!mutate && shouldShowRetryButton(error)
  }, [error, mutate])

  return {
    dataArray,
    isLoading: isLoading ?? false,
    error,
    mutate,
    isEmpty,
    shouldShowRetry,
  }
}

/**
 * Type guard to check if metric state has data.
 * Use this to narrow dataArray type from undefined to TData[].
 */
export function hasData<TData>(
  state: MetricState<TData>
): state is MetricState<TData> & { dataArray: TData[] } {
  return !state.isEmpty && !!state.dataArray
}
