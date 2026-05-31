'use client'

import type { OverviewChartConfig } from './charts-config'

import { OVERVIEW_TABS } from './charts-config'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { LazyChartWrapper } from '@/components/charts/lazy-chart-wrapper'
import { ClientOnly } from '@/components/client-only'
import { OverviewCharts } from '@/components/overview-charts/overview-charts-client'
import { OverviewStatusStrip } from '@/components/overview-charts/overview-status-strip'
import { ChartSkeleton, Skeleton, TabsSkeleton } from '@/components/skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

// Shared cluster-topology view — large SVG chunk, must not SSR. Reused as-is
// from the /clusters page so both surfaces render the same component.
const TopologyView = dynamic(
  () => import('@/components/cluster-topology').then((m) => m.TopologyView),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[540px] w-full rounded-xl" />,
  }
)

const VALID_TABS = new Set(OVERVIEW_TABS.map((tab) => tab.value))
const DEFAULT_TAB = 'overview'

/** Underline-active tab styling, overriding the shadcn pill defaults. */
const TAB_TRIGGER_CLASS = cn(
  // layout
  'h-auto flex-none px-3 py-2',
  // borders — bottom-only underline
  'rounded-none border-0 border-b-2 border-transparent bg-transparent shadow-none',
  // typography
  'text-[13px] font-medium text-muted-foreground',
  // states
  'transition-colors hover:text-foreground',
  'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none',
  'dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent'
)

interface LazyTabContentProps {
  charts: OverviewChartConfig[]
  gridClassName: string
  label: string
  hostId: number
}

// Number of charts to load immediately (first row in a 3-column grid).
// Charts at index >= EAGER_CHART_COUNT are deferred until scrolled into view.
const EAGER_CHART_COUNT = 3
const OVERVIEW_CHART_CLASS_NAME = 'h-full min-h-0 w-full'
const OVERVIEW_CHART_CARD_CONTENT_CLASS_NAME =
  'flex min-h-0 flex-1 flex-col px-3 pb-3 pt-0'

const LazyTabContent = function LazyTabContent({
  charts,
  gridClassName,
  label,
  hostId,
}: LazyTabContentProps) {
  return (
    <div className={gridClassName} role="region" aria-label={`${label} charts`}>
      {charts.map((chartConfig, index) => {
        const ChartComponent = chartConfig.component
        const chartEl = (
          <ChartComponent
            key={chartConfig.id}
            title={chartConfig.title}
            interval={chartConfig.interval}
            lastHours={chartConfig.lastHours}
            className={chartConfig.className}
            chartClassName={cn(
              OVERVIEW_CHART_CLASS_NAME,
              chartConfig.chartClassName
            )}
            chartCardContentClassName={cn(
              OVERVIEW_CHART_CARD_CONTENT_CLASS_NAME,
              chartConfig.chartCardContentClassName
            )}
            hostId={hostId}
            href={chartConfig.href}
            {...(chartConfig.props ?? {})}
          />
        )

        if (index < EAGER_CHART_COUNT) {
          return chartEl
        }

        return (
          <LazyChartWrapper
            key={chartConfig.id}
            className={chartConfig.className}
          >
            {chartEl}
          </LazyChartWrapper>
        )
      })}
    </div>
  )
}

function OverviewPageContent() {
  const hostId = useHostId()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Read tab from URL, validate and fallback to default
  const activeTab = (() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && VALID_TABS.has(tabParam)) {
      return tabParam
    }
    return DEFAULT_TAB
  })()

  // Track visited tabs for lazy loading (include the initial tab from URL)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([activeTab])
  )

  const handleTabChange = (value: string) => {
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
  }

  return (
    <div>
      <OverviewStatusStrip className="mb-3" />
      <OverviewCharts className="mb-4 sm:mb-6" />

      <ClientOnly fallback={<TabsSkeleton tabCount={OVERVIEW_TABS.length} />}>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-2"
        >
          <div className="overflow-x-auto pb-px">
            <TabsList className="inline-flex h-auto w-full min-w-max items-center justify-start gap-1 rounded-none border-b border-border bg-transparent p-0 text-muted-foreground">
              {OVERVIEW_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={TAB_TRIGGER_CLASS}
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
                tab.customContent === 'topology' ? (
                  <TopologyView
                    hostId={hostId}
                    detailHref={`/clusters?host=${hostId}`}
                  />
                ) : (
                  <LazyTabContent
                    charts={tab.charts}
                    gridClassName={tab.gridClassName}
                    label={tab.label}
                    hostId={hostId}
                  />
                )
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </ClientOnly>
    </div>
  )
}

// First (default) tab whose grid is shown on initial load. Reserving its real
// height in the fallback is what keeps the page scrollable while data loads.
const FIRST_TAB = OVERVIEW_TABS[0]

/**
 * Full-page loading fallback for the searchParams Suspense boundary.
 *
 * `OverviewPageContent` reads `useSearchParams()`/`useHostId()`, which Next.js
 * requires to sit under Suspense. A tiny single-card fallback collapses the
 * document to ~140px during that flash, so the scroll container has nothing to
 * scroll and the viewport snaps back to the top. Reserving the real layout's
 * height — status strip + KPI grid + tabs + the first tab's chart grid — keeps
 * the scroll position stable and lets the user scroll to the bottom while the
 * charts are still loading.
 */
function OverviewPageFallback() {
  return (
    <div>
      <Skeleton className="mb-3 h-10 w-full rounded-lg" />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <TabsSkeleton tabCount={OVERVIEW_TABS.length} />
      {/* Reserve the first tab's chart grid so the loading document is roughly
          as tall as the loaded page. Reuses the real grid class + chart count
          so it stays in sync if charts are added/removed. */}
      <div className={cn('mt-2', FIRST_TAB.gridClassName)} aria-hidden="true">
        {FIRST_TAB.charts.map((chart) => (
          <ChartSkeleton
            key={chart.id}
            className={cn(OVERVIEW_CHART_CLASS_NAME, chart.className)}
            type={chart.type === 'metric' ? 'metric' : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<OverviewPageFallback />}>
      <OverviewPageContent />
    </Suspense>
  )
}
