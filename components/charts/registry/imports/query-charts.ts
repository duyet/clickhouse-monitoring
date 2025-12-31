/**
 * Query chart imports
 *
 * Lazy-loaded query-related charts.
 */

import { lazy } from 'react'
import type { ChartRegistryMap } from '@/components/charts/registry/types'

export const queryChartImports: ChartRegistryMap = {
  'query-count': lazy(() =>
    import('@/components/charts/query/query-count').then((m) => ({
      default: m.ChartQueryCount,
    }))
  ),
  'query-count-by-user': lazy(() =>
    import('@/components/charts/query/query-count-by-user').then((m) => ({
      default: m.ChartQueryCountByUser,
    }))
  ),
  'query-duration': lazy(() =>
    import('@/components/charts/query/query-duration').then((m) => ({
      default: m.ChartQueryDuration,
    }))
  ),
  'query-memory': lazy(() =>
    import('@/components/charts/query/query-memory').then((m) => ({
      default: m.ChartQueryMemory,
    }))
  ),
  'query-type': lazy(() =>
    import('@/components/charts/query/query-type').then((m) => ({
      default: m.ChartQueryType,
    }))
  ),
  'failed-query-count': lazy(() =>
    import('@/components/charts/query/failed-query-count').then((m) => ({
      default: m.ChartFailedQueryCount,
    }))
  ),
  'failed-query-count-by-user': lazy(() =>
    import('@/components/charts/query/failed-query-count-by-user').then(
      (m) => ({
        default: m.ChartFailedQueryCountByType,
      })
    )
  ),
  'query-cache': lazy(() =>
    import('@/components/charts/query/query-cache').then((m) => ({
      default: m.ChartQueryCache,
    }))
  ),
}
