/**
 * System chart imports
 *
 * Lazy-loaded system metric charts.
 */

import type { ChartRegistryMap } from '@/components/charts/registry/types'

import { lazy } from 'react'

export const systemChartImports: ChartRegistryMap = {
  'disk-size': lazy(() =>
    import('@/components/charts/system/disk-size').then((m) => ({
      default: m.ChartDiskSize,
    }))
  ),
  'disks-usage': lazy(() =>
    import('@/components/charts/system/disks-usage').then((m) => ({
      default: m.ChartDisksUsage,
    }))
  ),
  'backup-size': lazy(() =>
    import('@/components/charts/system/backup-size').then((m) => ({
      default: m.ChartBackupSize,
    }))
  ),
  'memory-usage': lazy(() =>
    import('@/components/charts/system/memory-usage').then((m) => ({
      default: m.ChartMemoryUsage,
    }))
  ),
  'cpu-usage': lazy(() =>
    import('@/components/charts/system/cpu-usage').then((m) => ({
      default: m.ChartCPUUsage,
    }))
  ),
}
