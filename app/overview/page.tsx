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

export const dynamic = 'force-dynamic'
export const revalidate = 5

// Displays an overview of system metrics.
export default async function Overview() {
  noStore()

  return (
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
            <ChartMemoryUsage
              title="Memory Usage last 24h (avg / 10 minutes)"
              className="w-full"
              chartClassName="h-72"
              interval="toStartOfTenMinutes"
              lastHours={24}
            />
          </ServerComponentLazy>

          <ServerComponentLazy>
            <ChartCPUUsage
              title="CPU Usage last 24h (avg / 10 minutes)"
              className="w-full"
              chartClassName="h-72"
              interval="toStartOfTenMinutes"
              lastHours={24}
            />
          </ServerComponentLazy>

          <ServerComponentLazy>
            <ChartQueryCountByUser title="Query Count" className="w-full p-5" />
          </ServerComponentLazy>

          <ServerComponentLazy>
            <ChartMergeCount
              title="Merge and PartMutation (Avg)"
              className="w-full p-5"
              chartClassName="h-72"
            />
          </ServerComponentLazy>

          <ServerComponentLazy>
            <ChartTopTableSize className="w-full p-5" />
          </ServerComponentLazy>

          <ServerComponentLazy>
            <ChartNewPartsCreated
              className="w-full p-5"
              title="New Parts Created over last 24 hours"
              interval="toStartOfHour"
              lastHours={24}
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
            <ChartBackupSize className="w-full p-5" title="Backup" />
          </ServerComponentLazy>
        </div>
      </TabsContent>
    </Tabs>
  )
}
