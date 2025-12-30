'use client'

import { Suspense } from 'react'
import { OverviewPageSkeleton } from '@/components/page-skeleton'
import { ChartBackupSize } from '@/components/charts/backup-size'
import { ChartCPUUsage } from '@/components/charts/cpu-usage'
import { ChartDiskSize } from '@/components/charts/disk-size'
import { ChartDisksUsage } from '@/components/charts/disks-usage'
import { ChartMemoryUsage } from '@/components/charts/memory-usage'
import { ChartMergeCount } from '@/components/charts/merge-count'
import { ChartNewPartsCreated } from '@/components/charts/new-parts-created'
import { ChartQueryCount } from '@/components/charts/query-count'
import { ChartQueryCountByUser } from '@/components/charts/query-count-by-user'
import { ChartTopTableSize } from '@/components/charts/top-table-size'
import { ChartKeeperException } from '@/components/charts/zookeeper-exception'
import { OverviewCharts } from '@/components/overview-charts/overview-charts-client'
import { StaggeredChart } from '@/components/progressive-loader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHostId } from '@/lib/swr'

export default function OverviewPage() {
  const hostId = useHostId()

  return (
    <Suspense fallback={<OverviewPageSkeleton />}>
      <div>
        <OverviewCharts hostId={hostId} className="mb-3" />

      <Tabs defaultValue="overview" className="space-y-3">
        <div className="flex items-center justify-between space-y-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="disks">Disks</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-3">
          <div
            className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="region"
            aria-label="Overview charts"
          >
            <StaggeredChart index={0} stagger={80} priority="high" aria-label="Query count chart">
              <ChartQueryCount
                title="Query Count last 24h"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full"
                chartClassName="h-52"
                hostId={hostId}
              />
            </StaggeredChart>

            <StaggeredChart index={1} stagger={80} priority="high" aria-label="Query count by user chart">
              <ChartQueryCountByUser
                title="Query Count by User last 24h"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full"
                chartClassName="h-52"
                hostId={hostId}
              />
            </StaggeredChart>

            <StaggeredChart index={2} stagger={80} aria-label="Query count 14 days chart">
              <ChartQueryCountByUser
                title="Query Count last 14d"
                lastHours={24 * 14}
                interval="toStartOfDay"
                className="w-full"
                chartClassName="h-52"
                hostId={hostId}
              />
            </StaggeredChart>

            <StaggeredChart index={3} stagger={80} aria-label="Memory usage chart">
              <ChartMemoryUsage
                title="Memory Usage last 24h (avg / 10 minutes)"
                className="w-full"
                chartClassName="h-52"
                interval="toStartOfTenMinutes"
                lastHours={24}
                hostId={hostId}
              />
            </StaggeredChart>

            <StaggeredChart index={4} stagger={80} aria-label="CPU usage chart">
              <ChartCPUUsage
                title="CPU Usage last 24h (avg / 10 minutes)"
                className="w-full"
                chartClassName="h-52"
                interval="toStartOfTenMinutes"
                lastHours={24}
                hostId={hostId}
              />
            </StaggeredChart>

            <StaggeredChart index={5} stagger={80} aria-label="Merge count chart">
              <ChartMergeCount
                title="Merge and PartMutation last 24h (avg)"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full"
                chartClassName="h-52"
                hostId={hostId}
              />
            </StaggeredChart>

            <StaggeredChart index={6} stagger={80} priority="low" aria-label="Top table sizes chart">
              <ChartTopTableSize className="w-full" hostId={hostId} />
            </StaggeredChart>

            <StaggeredChart index={7} stagger={80} priority="low" aria-label="New parts created chart">
              <ChartNewPartsCreated
                className="w-full"
                chartClassName="h-52"
                title="New Parts Created over last 7 days"
                interval="toStartOfHour"
                lastHours={24 * 7}
                hostId={hostId}
              />
            </StaggeredChart>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-3">
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StaggeredChart index={0} stagger={80}>
              <ChartKeeperException className="w-full" hostId={hostId} />
            </StaggeredChart>
          </div>
        </TabsContent>

        <TabsContent value="disks" className="space-y-3">
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StaggeredChart index={0} stagger={80}>
              <ChartDiskSize
                className="w-full"
                title="Disk Size"
                hostId={hostId}
              />
            </StaggeredChart>
            <StaggeredChart index={1} stagger={80}>
              <ChartDisksUsage
                className="w-full"
                chartClassName="h-52"
                title="Disks Usage over last 30 days"
                interval="toStartOfDay"
                lastHours={24 * 30}
                hostId={hostId}
              />
            </StaggeredChart>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-3">
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StaggeredChart index={0} stagger={80}>
              <ChartBackupSize
                className="w-full"
                title="Backup"
                chartClassName="h-52"
                hostId={hostId}
              />
            </StaggeredChart>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </Suspense>
  )
}
