'use client'

import { Suspense } from 'react'
import { ChartBackupSize } from '@/components/charts/system/backup-size'
import { ChartCPUUsage } from '@/components/charts/system/cpu-usage'
import { ChartDiskSize } from '@/components/charts/system/disk-size'
import { ChartDisksUsage } from '@/components/charts/system/disks-usage'
import { ChartMemoryUsage } from '@/components/charts/system/memory-usage'
import { ChartMergeCount } from '@/components/charts/merge/merge-count'
import { ChartNewPartsCreated } from '@/components/charts/merge/new-parts-created'
import { ChartQueryCount } from '@/components/charts/query/query-count'
import { ChartQueryCountByUser } from '@/components/charts/query/query-count-by-user'
import { ChartTopTableSize } from '@/components/charts/top-table-size'
import { ChartKeeperException } from '@/components/charts/zookeeper/zookeeper-exception'
import { OverviewCharts } from '@/components/overview-charts/overview-charts-client'
import { PageSkeleton } from '@/components/skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHostId } from '@/lib/swr'

export default function OverviewPage() {
  const hostId = useHostId()

  return (
    <Suspense fallback={<PageSkeleton chartCount={8} />}>
      <div>
        <OverviewCharts className="mb-6" />

        <Tabs defaultValue="overview" className="space-y-2">
          <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
            <TabsList className="w-full sm:w-fit inline-flex min-w-max">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="disks">Disks</TabsTrigger>
              <TabsTrigger value="backups">Backups</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-2">
            <div
              className="grid auto-rows-fr items-stretch gap-3 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 min-w-0"
              role="region"
              aria-label="Overview charts"
            >
              <ChartQueryCount
                title="Query Count last 24h"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full h-80"
                hostId={hostId}
              />

              <ChartQueryCountByUser
                title="Query Count by User last 24h"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full h-80"
                hostId={hostId}
              />

              <ChartQueryCountByUser
                title="Query Count last 14d"
                lastHours={24 * 14}
                interval="toStartOfDay"
                className="w-full h-80"
                hostId={hostId}
              />

              <ChartMemoryUsage
                title="Memory Usage last 24h (avg / 10 minutes)"
                className="w-full h-80"
                interval="toStartOfTenMinutes"
                lastHours={24}
                hostId={hostId}
              />

              <ChartCPUUsage
                title="CPU Usage last 24h (avg / 10 minutes)"
                className="w-full h-80"
                interval="toStartOfTenMinutes"
                lastHours={24}
                hostId={hostId}
              />

              <ChartMergeCount
                title="Merge and PartMutation last 24h (avg)"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full h-80"
                hostId={hostId}
              />

              <ChartTopTableSize className="w-full h-[220px]" hostId={hostId} />

              <ChartNewPartsCreated
                className="w-full h-80"
                title="New Parts Created over last 7 days"
                interval="toStartOfHour"
                lastHours={24 * 7}
                hostId={hostId}
              />
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-2">
            <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 xl:grid-cols-3 min-w-0">
              <ChartKeeperException className="w-full" hostId={hostId} />
            </div>
          </TabsContent>

          <TabsContent value="disks" className="space-y-2">
            <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 xl:grid-cols-3 min-w-0">
              <ChartDiskSize
                className="w-full"
                title="Disk Size"
                hostId={hostId}
              />
              <ChartDisksUsage
                className="w-full h-80"
                title="Disks Usage over last 30 days"
                interval="toStartOfDay"
                lastHours={24 * 30}
                hostId={hostId}
              />
            </div>
          </TabsContent>

          <TabsContent value="backups" className="space-y-2">
            <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 xl:grid-cols-3 min-w-0">
              <ChartBackupSize
                className="w-full"
                title="Backup"
                chartClassName="h-full h-[140px] sm:h-[160px]"
                hostId={hostId}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  )
}
