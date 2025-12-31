'use client'

import { OverviewCharts } from '@/components/overview-charts/overview-charts-client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHostId } from '@/lib/swr'
import { OVERVIEW_TABS } from './charts-config'

/**
 * OverviewPage - Main overview dashboard with tabbed chart views
 *
 * Displays system metrics, query statistics, disk usage, and backup information
 * organized across multiple tabs for better navigation and clarity.
 */
export default function OverviewPage() {
  const hostId = useHostId()

  return (
    <div>
      <OverviewCharts className="mb-6" />

      <Tabs defaultValue="overview" className="space-y-2">
        <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
          <TabsList className="w-full sm:w-fit inline-flex min-w-max">
            {OVERVIEW_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {OVERVIEW_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-2">
            <div
              className={tab.gridClassName}
              role="region"
              aria-label={`${tab.label} charts`}
            >
              {tab.charts.map((chartConfig) => {
                const ChartComponent = chartConfig.component

                return (
                  <ChartComponent
                    key={chartConfig.id}
                    title={chartConfig.title}
                    interval={chartConfig.interval}
                    lastHours={chartConfig.lastHours}
                    className={chartConfig.className}
                    chartClassName={chartConfig.chartClassName}
                    chartCardContentClassName={
                      chartConfig.chartCardContentClassName
                    }
                    hostId={hostId}
                    {...(chartConfig.props ?? {})}
                  />
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
