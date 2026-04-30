'use client'

import { Loader2Icon } from 'lucide-react'

import { lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'

// Lazy load chart primitives for performance
const AreaChartPrimitive = lazy(() =>
  import('@/components/charts/primitives/area').then((m) => ({
    default: m.AreaChart,
  }))
)
const BarList = lazy(() =>
  import('@/components/charts/primitives/bar-list').then((m) => ({
    default: m.BarList,
  }))
)
const DonutChart = lazy(() =>
  import('@/components/charts/primitives/donut').then((m) => ({
    default: m.DonutChart,
  }))
)

// ============================================================================
// Types
// ============================================================================

export interface AgentChartRendererProps {
  /**
   * Chart type to render
   * - 'area': Time-series area chart
   * - 'bar': Horizontal bar list for categorical data
   * - 'donut': Circular pie/donut chart
   */
  type: 'area' | 'bar' | 'donut'

  /**
   * Chart data points
   */
  data: readonly Record<string, unknown>[]

  /**
   * Optional chart title
   */
  title?: string

  /**
   * X-axis/index key (default: 'name')
   */
  xKey?: string

  /**
   * Y-axis/value key (default: 'value')
   */
  yKey?: string

  /**
   * Additional category keys for multi-series charts
   */
  categories?: string[]

  /**
   * Optional CSS class name
   */
  className?: string

  /**
   * Format hint for readable value display
   */
  readable?: 'bytes' | 'duration' | 'number' | 'quantity'
}

// ============================================================================
// Sub-components
// ============================================================================

function ChartSkeleton() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AgentChartRenderer - Render charts in agent chat responses
 *
 * Reuses existing chart primitives with lazy loading for performance.
 * Supports area charts (time-series), bar lists (categorical), and donut charts.
 *
 * @example
 * // Bar chart for top tables
 * <AgentChartRenderer
 *   type="bar"
 *   data={[{ name: 'table1', value: 100 }, { name: 'table2', value: 50 }]}
 *   title="Top Tables by Size"
 * />
 *
 * @example
 * // Area chart for time-series data
 * <AgentChartRenderer
 *   type="area"
 *   data={[{ time: '10:00', value: 100 }, { time: '11:00', value: 150 }]}
 *   xKey="time"
 *   categories={['value']}
 * />
 *
 * @example
 * // Donut chart for distribution
 * <AgentChartRenderer
 *   type="donut"
 *   data={[{ name: 'Used', value: 75 }, { name: 'Free', value: 25 }]}
 *   xKey="name"
 * />
 */
export function AgentChartRenderer({
  type,
  data,
  title,
  xKey = 'name',
  yKey = 'value',
  categories,
  className,
  readable,
}: AgentChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4 text-sm">
        No data available for chart
      </div>
    )
  }

  const chartData = data as Record<string, unknown>[]

  return (
    <div
      className={cn(type === 'area' && 'h-64 min-h-[16rem] w-full', className)}
    >
      {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
      <Suspense fallback={<ChartSkeleton />}>
        {type === 'area' && (
          <AreaChartPrimitive
            data={chartData}
            index={xKey}
            categories={categories || [yKey]}
            showXAxis
            showYAxis
            showCartesianGrid
            stack={false}
            opacity={0.6}
          />
        )}
        {type === 'bar' && (
          <BarList
            data={
              chartData as Array<{
                name: string
                value: number
                [key: string]: unknown
              }>
            }
          />
        )}
        {type === 'donut' && (
          <DonutChart
            data={chartData}
            index={xKey}
            category={yKey}
            readable={readable}
            showLegend
            innerRadius={60}
            outerRadius={80}
          />
        )}
      </Suspense>
    </div>
  )
}
