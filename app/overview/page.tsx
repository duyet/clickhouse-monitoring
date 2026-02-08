'use client'

import { ListBulletIcon, RowsIcon } from '@radix-ui/react-icons'

import type { OverviewChartConfig } from './charts-config'

import { OVERVIEW_TABS } from './charts-config'
import { useRouter, useSearchParams } from 'next/navigation'
import { memo, Suspense, useCallback, useMemo, useState } from 'react'
import { ClientOnly } from '@/components/client-only'
import { BentoOverview } from '@/components/overview/bento-overview'
import { OverviewCharts } from '@/components/overview-charts/overview-charts-client'
import { ChartSkeleton, TabsSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHostId } from '@/lib/swr'

const VALID_TABS = new Set(OVERVIEW_TABS.map((tab) => tab.value))
const DEFAULT_TAB = 'overview'

type ViewMode = 'bento' | 'classic'

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
  const searchParams = useSearchParams()
  const router = useRouter()

  // Read view mode from URL params
  const viewMode = useMemo(() => {
    const mode = searchParams.get('view')
    return mode === 'classic' ? 'classic' : 'bento'
  }, [searchParams])

  // Read tab from URL, validate and fallback to default
  const activeTab = useMemo(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && VALID_TABS.has(tabParam)) {
      return tabParam
    }
    return DEFAULT_TAB
  }, [searchParams])

  // Track visited tabs for lazy loading (include the initial tab from URL)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([activeTab])
  )

  const handleTabChange = useCallback(
    (value: string) => {
      // Update URL with new tab value, preserving other params
      const params = new URLSearchParams(searchParams.toString())
      if (value === DEFAULT_TAB) {
        // Remove tab param if it's the default value (cleaner URL)
        params.delete('tab')
      } else {
        params.set('tab', value)
      }

      // Use replace to avoid adding to browser history for every tab change
      const newUrl = `${window.location.pathname}?${params.toString()}`
      router.replace(newUrl, { scroll: false })

      // Update visited tabs for lazy loading
      setVisitedTabs((prev) => {
        if (prev.has(value)) return prev
        return new Set([...prev, value])
      })
    },
    [searchParams, router]
  )

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString())
      if (mode === 'bento') {
        params.delete('view')
      } else {
        params.set('view', mode)
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`
      router.replace(newUrl, { scroll: false })
    },
    [searchParams, router]
  )

  return (
    <div>
      {/* View mode toggle and header section */}
      <div className="mb-4">
        {/* View toggle button */}
        <div className="flex justify-end mb-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-background/80 p-1 backdrop-blur-sm">
            <Button
              variant={viewMode === 'bento' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('bento')}
              className="gap-1.5 h-8 px-2.5"
            >
              <RowsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Bento</span>
            </Button>
            <Button
              variant={viewMode === 'classic' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('classic')}
              className="gap-1.5 h-8 px-2.5"
            >
              <ListBulletIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Classic</span>
            </Button>
          </div>
        </div>

        {/* View mode content */}
        {viewMode === 'bento' ? <BentoOverview /> : <OverviewCharts />}
      </div>

      <ClientOnly fallback={<TabsSkeleton tabCount={OVERVIEW_TABS.length} />}>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-2"
        >
          <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
            <TabsList className="h-11 gap-1 w-full md:w-fit inline-flex min-w-max backdrop-blur-sm border border-border/40 p-1">
              {OVERVIEW_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="!h-auto min-h-10 sm:min-h-0 px-3 sm:px-2 py-2 sm:py-1 data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all duration-200"
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
              className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out data-[state=inactive]:hidden"
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
