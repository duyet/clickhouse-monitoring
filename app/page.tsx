import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartAvgMemory } from '@/components/charts/avg-memory'
import ChartMergeCountSpark from '@/components/charts/merge-count-spark'
import { ChartQueryCount } from '@/components/charts/query-count'
import { IntervalSelect } from '@/components/interval-select'

export default function Home() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="disks">Disks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <div className="flex items-center space-x-2">
          <IntervalSelect />
        </div>
      </div>
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 items-center gap-5">
          <ChartAvgMemory
            title="Avg Memory"
            className="w-full"
            chartClassName="h-72"
          />
          <ChartQueryCount
            title="Query Count"
            className="w-full"
            chartClassName="h-72"
          />
          <ChartMergeCountSpark
            title="Merge and PartMutation (Avg)"
            className="w-full"
            chartClassName="h-72"
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
