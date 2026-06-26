import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { FleetOverview } from '@/components/fleet/fleet-overview'
import { PageHeader } from '@/components/layout'
import { Skeleton } from '@/components/ui/skeleton'
import { pageOgHead } from '@/lib/og'

function FleetSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
        <Skeleton key={i} className="h-44 w-full rounded-xl" />
      ))}
    </div>
  )
}

function FleetPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Fleet Overview"
        description="Health signals across all ClickHouse hosts in one view."
      />
      <Suspense fallback={<FleetSkeleton />}>
        <FleetOverview />
      </Suspense>
    </div>
  )
}

export const Route = createFileRoute('/(dashboard)/fleet')({
  component: FleetPage,
  head: () => pageOgHead('fleet'),
})
