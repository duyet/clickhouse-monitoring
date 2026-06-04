import { createFileRoute } from '@tanstack/react-router'

import { ChartsSection } from './-insights/charts-section'
import { StatsGrid } from './-insights/stats-grid'
import {
  DATE_RANGE_PRESETS,
  DateRangeSelector,
  RANGE_OPTIONS,
  useDateRange,
} from '@/components/date-range'
import { useHostId } from '@/lib/swr'

function InsightsPage() {
  const hostId = useHostId()
  const { lastHours, range, setRange } = useDateRange({
    config: DATE_RANGE_PRESETS.insights,
  })

  const rangeLabel = (
    RANGE_OPTIONS[range.value as keyof typeof RANGE_OPTIONS]?.description ??
    'All available data'
  ).toLowerCase()

  return (
    <div className="flex flex-col gap-4 sm:gap-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Cluster Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record-breaking queries, storage statistics, and performance
            highlights (showing {rangeLabel})
          </p>
        </div>
        <DateRangeSelector
          config={DATE_RANGE_PRESETS.insights}
          value={range.value}
          onChange={setRange}
          alwaysVisible
        />
      </div>
      <StatsGrid hostId={hostId} lastHours={lastHours} />
      <ChartsSection hostId={hostId} />
    </div>
  )
}

export const Route = createFileRoute('/(dashboard)/insights')({
  component: InsightsPage,
})
