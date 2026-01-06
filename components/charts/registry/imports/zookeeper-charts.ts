/**
 * ZooKeeper chart imports
 *
 * Lazy-loaded ZooKeeper-related charts.
 */

import type { ChartRegistryMap } from '@/components/charts/registry/types'

import { lazy } from 'react'

export const zookeeperChartImports: ChartRegistryMap = {
  'zookeeper-summary-table': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-summary-table').then(
      (m) => ({
        default: m.default,
      })
    )
  ),
  'zookeeper-uptime': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-uptime').then((m) => ({
      default: m.ChartZookeeperUptime,
    }))
  ),
  'zookeeper-requests': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-requests').then((m) => ({
      default: m.default,
    }))
  ),
  'zookeeper-wait': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-wait').then((m) => ({
      default: m.default,
    }))
  ),
  'zookeeper-exception': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-exception').then((m) => ({
      default: m.ChartKeeperException,
    }))
  ),
}
