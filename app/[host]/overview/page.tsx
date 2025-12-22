import { ChartBackupSize, ChartCPUUsage, ChartDiskSize, ChartDisksUsage, ChartMemoryUsage, ChartMergeCount, ChartNewPartsCreated, ChartQueryCount, ChartQueryCountByUser, ChartTopTableSize, ChartKeeperException } from '@/components/charts/metrics'
import { ServerComponentLazy } from '@/components/server-component-lazy'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { OverviewCharts } from './overview-charts'

export const dynamic = 'force-dynamic'
export const revalidate = 5

export default async function Overview({
  params,
}: {
  params: Promise<{ host: string }>
}) {
  const { host } = await params
  const hostId = Number(host)

  return (
    <div>
      <OverviewCharts className="mb-10" />

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="disks">Disks</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            <ServerComponentLazy>
              <ChartQueryCount
                title="Query Count last 24h"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full p-5"
                chartClassName="h-64"
                hostId={hostId}
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartQueryCountByUser
                title="Query Count by User last 24h"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full p-5"
                chartClassName="h-64"
                hostId={hostId}
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartQueryCountByUser
                title="Query Count last 14d"
                lastHours={24 * 14}
                interval="toStartOfDay"
                className="w-full p-5"
                chartClassName="h-64"
                hostId={hostId}
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartMemoryUsage
                title="Memory Usage last 24h (avg / 10 minutes)"
                className="w-full"
                chartClassName="h-64"
                interval="toStartOfTenMinutes"
                lastHours={24}
                hostId={hostId}
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartCPUUsage
                title="CPU Usage last 24h (avg / 10 minutes)"
                className="w-full"
                chartClassName="h-64"
                interval="toStartOfTenMinutes"
                lastHours={24}
                hostId={hostId}
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartMergeCount
                title="Merge and PartMutation last 24h (avg)"
                lastHours={24}
                interval="toStartOfHour"
                className="w-full p-5"
                chartClassName="h-64"
                hostId={hostId}
              />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartTopTableSize className="w-full p-5" hostId={hostId} />
            </ServerComponentLazy>

            <ServerComponentLazy>
              <ChartNewPartsCreated
                className="w-full p-5"
                chartClassName="h-64"
                title="New Parts Created over last 7 days"
                interval="toStartOfHour"
                lastHours={24 * 7}
                hostId={hostId}
              />
            </ServerComponentLazy>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            <ServerComponentLazy>
              <ChartKeeperException className="w-full p-5" hostId={hostId} />
            </ServerComponentLazy>
          </div>
        </TabsContent>

        <TabsContent value="disks" className="space-y-4">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            <ServerComponentLazy>
              <ChartDiskSize
                className="w-full p-5"
                title="Disk Size"
                hostId={hostId}
              />
            </ServerComponentLazy>
            <ServerComponentLazy>
              <ChartDisksUsage
                className="w-full p-5"
                chartClassName="h-64"
                title="Disks Usage over last 30 days"
                interval="toStartOfDay"
                lastHours={24 * 30}
                hostId={hostId}
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
                hostId={hostId}
              />
            </ServerComponentLazy>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
