import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IntervalSelect } from '@/components/interval-select'
import { ChartAvgMemory } from '@/components/charts/avg-memory'

export default function Home() {
  return (
    <Tabs defaultValue='overview' className='space-y-4'>
      <div className='flex items-center justify-between space-y-2'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='disks'>Disks</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>
        <div className='flex items-center space-x-2'>
          <IntervalSelect />
        </div>
      </div>
      <TabsContent value='overview' className='space-y-4'>
        <ChartAvgMemory title='Avg Memory' interval={'toStartOfFifteenMinutes'} />
      </TabsContent>
    </Tabs>
  )
}
