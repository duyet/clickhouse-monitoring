import { unstable_noStore as noStore } from 'next/cache'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartAvgMemory } from '@/components/charts/avg-memory'
import { ChartDisksUsage } from '@/components/charts/disks-usage'
import { ChartMergeCount } from '@/components/charts/merge-count'
import { ChartQueryCountByUser } from '@/components/charts/query-count-by-user'
import { ChartTopTableSize } from '@/components/charts/top-table-size'
import { IntervalSelect } from '@/components/interval-select'

export const dynamic = 'force-dynamic'
export const revalidate = 5

export default async function Overview() {
  noStore()

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="disks" disabled>
            Disks
          </TabsTrigger>
          <TabsTrigger value="settings" disabled>
            Settings
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center space-x-2">
          <IntervalSelect />
        </div>
      </div>
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
          <ChartAvgMemory
            title="Memory Usage last 24h (avg / 10 minutes)"
            className="w-full"
            chartClassName="h-72"
            interval="toStartOfTenMinutes"
            lastHours={24}
          />
          <ChartQueryCountByUser title="Query Count" className="w-full p-5" />
          <ChartMergeCount
            title="Merge and PartMutation (Avg)"
            className="w-full p-5"
            chartClassName="h-72"
          />
          <ChartTopTableSize className="w-full p-5" />
          <ChartDisksUsage
            title="Disks Usage over last 14 days"
            className="w-full p-5"
            interval="toStartOfHour"
            lastHours={24 * 14}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
