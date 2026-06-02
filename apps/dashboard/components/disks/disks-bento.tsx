'use client'

import { DiskCard, type DiskRow } from './disk-card'
import { ChartError } from '@/components/charts/chart-error'
import { Skeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import { useHostId } from '@/lib/swr'
import { useTableData } from '@/lib/swr/use-table-data'

const GRID_CLASS =
  'grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3'

function DisksBentoSkeleton() {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-xl" />
      ))}
    </div>
  )
}

/**
 * Bento/grid layout for system.disks — one card per disk with a
 * color-accented usage bar. Used as the `tableSlot` of the disks page so the
 * related charts, title and permission gating from QueryPageLayout are kept.
 */
export function DisksBento() {
  const hostId = useHostId()
  const { data, error, isLoading, hasData, refresh } = useTableData<DiskRow>(
    'disks',
    hostId
  )

  if (isLoading && !hasData) {
    return <DisksBentoSkeleton />
  }

  if (error && !hasData) {
    return <ChartError error={error} title="Disks" onRetry={() => refresh()} />
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No disks found" />
  }

  return (
    <div className={GRID_CLASS}>
      {data.map((disk) => (
        <DiskCard key={disk.name} disk={disk} />
      ))}
    </div>
  )
}
