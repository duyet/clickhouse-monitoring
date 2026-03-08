/**
 * Query performance chart imports
 *
 * Lazy-loaded charts for insert throughput and top inserters.
 */

import type { ChartRegistryMap } from '@/components/charts/registry/types'

import { lazy } from 'react'

export const queryPerfChartImports: ChartRegistryMap = {
  'insert-performance': lazy(() =>
    import('@/components/charts/query-performance/insert-performance').then(
      (m) => ({
        default: m.ChartInsertPerformance,
      })
    )
  ),
  'top-inserters': lazy(() =>
    import('@/components/charts/query-performance/top-inserters').then((m) => ({
      default: m.ChartTopInserters,
    }))
  ),
}
