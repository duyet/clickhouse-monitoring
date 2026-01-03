'use client'

import type { OverviewChartConfig } from './charts-config'

import { OVERVIEW_TABS } from './charts-config'
import { memo, Suspense, useCallback, useState } from 'react'
import { ClientOnly } from '@/components/client-only'
import { OverviewCharts } from '@/components/overview-charts/overview-charts-client'
import { ChartSkeleton, TabsSkeleton } from '@/components/skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHostId } from '@/lib/swr'

interface LazyTabContentProps {
  charts: OverviewChartConfig[]
  gridClassName: string
  label: string
  hostId: number
}

const LazyTabContent = memo(function LazyTabContent({
  charts,
  gridClassName,
  label,
  hostId,
}: LazyTabContentProps) {
  return (
    <div className={gridClassName} role="region" aria-label={`${label} charts`}>
      {charts.map((chartConfig) => {
        const ChartComponent = chartConfig.component
        return (
          <ChartComponent
            key={chartConfig.id}
            title={chartConfig.title}
            interval={chartConfig.interval}
            lastHours={chartConfig.lastHours}
            className={chartConfig.className}
            chartClassName={chartConfig.chartClassName}
            chartCardContentClassName={chartConfig.chartCardContentClassName}
            hostId={hostId}
            {...(chartConfig.props ?? {})}
          />
        )
      })}
    </div>
  )
})

function OverviewPageContent() {
  const hostId = useHostId()
  const [activeTab, setActiveTab] = useState('overview')
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set(['overview'])
  )

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    setVisitedTabs((prev) => {
      if (prev.has(value)) return prev
      return new Set([...prev, value])
    })
  }, [])

  return (
    <div>
      <OverviewCharts className="mb-6" />

      <ClientOnly fallback={<TabsSkeleton tabCount={OVERVIEW_TABS.length} />}>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-2"
        >
          <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
            <TabsList className="w-full sm:w-fit inline-flex min-w-max bg-muted/50 backdrop-blur-sm border border-border/40 shadow-sm">
              {OVERVIEW_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {OVERVIEW_TABS.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out"
              forceMount={visitedTabs.has(tab.value) ? true : undefined}
            >
              {visitedTabs.has(tab.value) ? (
                <LazyTabContent
                  charts={tab.charts}
                  gridClassName={tab.gridClassName}
                  label={tab.label}
                  hostId={hostId}
                />
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </ClientOnly>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <OverviewPageContent />
    </Suspense>
  )
}
