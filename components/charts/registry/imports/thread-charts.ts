/**
 * Thread chart imports
 *
 * Lazy-loaded thread performance and utilization charts.
 */

import type { ChartRegistryMap } from '@/components/charts/registry/types'

import { lazy } from 'react'

export const threadChartImports: ChartRegistryMap = {
  'thread-utilization': lazy(() =>
    import('@/components/charts/threads/thread-utilization').then((m) => ({
      default: m.ChartThreadUtilization,
    }))
  ),
}
