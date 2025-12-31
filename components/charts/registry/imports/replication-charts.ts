/**
 * Replication chart imports
 *
 * Lazy-loaded replication-related charts.
 */

import { lazy } from 'react'
import type { ChartRegistryMap } from '@/components/charts/registry/types'

export const replicationChartImports: ChartRegistryMap = {
  'replication-queue-count': lazy(() =>
    import('@/components/charts/replication/replication-queue-count').then((m) => ({
      default: m.default,
    }))
  ),
  'replication-summary-table': lazy(() =>
    import('@/components/charts/replication/replication-summary-table').then((m) => ({
      default: m.default,
    }))
  ),
  'readonly-replica': lazy(() =>
    import('@/components/charts/replication/readonly-replica').then((m) => ({
      default: m.ChartReadonlyReplica,
    }))
  ),
}
