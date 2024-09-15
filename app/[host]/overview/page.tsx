import { unstable_noStore as noStore } from 'next/cache'

import { ChartBackupSize } from '@/components/charts/backup-size'
import { ChartCPUUsage } from '@/components/charts/cpu-usage'
import { ChartDiskSize } from '@/components/charts/disk-size'
import { ChartDisksUsage } from '@/components/charts/disks-usage'
import { ChartMemoryUsage } from '@/components/charts/memory-usage'
import { ChartMergeCount } from '@/components/charts/merge-count'
import { ChartNewPartsCreated } from '@/components/charts/new-parts-created'
import { ChartQueryCountByUser } from '@/components/charts/query-count-by-user'
import { ChartTopTableSize } from '@/components/charts/top-table-size'
import { ServerComponentLazy } from '@/components/server-component-lazy'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewCharts } from './overview-charts'

export const dynamic = 'force-dynamic'
export const revalidate = 5

// Displays an overview of system metrics.
export default async function Overview() {
  noStore()

  return (
    <div>
      <OverviewCharts className="mb-10" />

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="disks">Disks</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            <ServerComponentLazy>
              <ChartQueryCountByUser
                title="Query Count last 24h"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full p-5"
                chartClassName="h-64"
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartQueryCountByUser
                title="Query Count last 14d"
                lastHours={24 * 14}
                interval="toStartOfDay"
                className="w-full p-5"
                chartClassName="h-64"
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartMemoryUsage
                title="Memory Usage last 24h (avg / 10 minutes)"
                className="w-full"
                chartClassName="h-64"
                interval="toStartOfTenMinutes"
                lastHours={24}
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartCPUUsage
                title="CPU Usage last 24h (avg / 10 minutes)"
                className="w-full"
                chartClassName="h-64"
                interval="toStartOfTenMinutes"
                lastHours={24}
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartMergeCount
                title="Merge and PartMutation last 24h (avg)"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full p-5"
                chartClassName="h-64"
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartTopTableSize className="w-full p-5" />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartNewPartsCreated
                className="w-full p-5"
                chartClassName="h-64"
                title="New Parts Created over last 7 days"
                interval="toStartOfHour"
                lastHours={24 * 7}
              />
            </ServerComponentLazy>
          </div>
        </TabsContent>

        <TabsContent value="disks" className="space-y-4">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            <ServerComponentLazy>
              <ChartDiskSize className="w-full p-5" title="Disk Size" />
            </ServerComponentLazy>
            <ServerComponentLazy>
              <ChartDisksUsage
                className="w-full p-5"
                chartClassName="h-64"
                title="Disks Usage over last 30 days"
                interval="toStartOfDay"
                lastHours={24 * 30}
              />
            </ServerComponentLazy>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            <ServerComponentLazy>
              <ChartBackupSize
                className="w-full p-5"
                title="Backup"
                chartClassName="h-64"
              />
            </ServerComponentLazy>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
