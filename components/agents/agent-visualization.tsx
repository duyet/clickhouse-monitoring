'use client'

import { BarChart3Icon, DownloadIcon, Loader2Icon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import type { QueryConfig } from '@/types/query-config'

import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportToCsv } from '@/lib/agent-export'
import { cn } from '@/lib/utils'

// ============================================================================
// Lazy-loaded chart primitives
// ============================================================================

const AreaChartPrimitive = lazy(() =>
  import('@/components/charts/primitives/area').then((m) => ({
    default: m.AreaChart,
  }))
)

const DonutChart = lazy(() =>
  import('@/components/charts/primitives/donut').then((m) => ({
    default: m.DonutChart,
  }))
)

const NumberChart = lazy(() =>
  import('@/components/charts/primitives/number').then((m) => ({
    default: m.NumberChart,
  }))
)

// ============================================================================
// Types
// ============================================================================

export interface VizConfig {
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'number' | 'table'
  xKey: string
  yKeys: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  readable?: 'bytes' | 'duration' | 'number' | 'quantity'
}

export interface AgentVisualizationProps {
  title?: string
  sql: string
  rows: Record<string, unknown>[]
  columns: string[]
  rowCount: number
  viz: VizConfig
  className?: string
}

type ChartType = VizConfig['chartType']

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: 'Bar',
  line: 'Line',
  area: 'Area',
  pie: 'Pie',
  number: 'Number',
  table: 'Table',
}

// ============================================================================
// Helpers
// ============================================================================

function isNumericColumn(
  rows: Record<string, unknown>[],
  col: string
): boolean {
  if (rows.length === 0) return false
  const sample = rows.find((r) => r[col] !== null && r[col] !== undefined)
  if (!sample) return false
  return typeof sample[col] === 'number' || !Number.isNaN(Number(sample[col]))
}

function sortRows(
  rows: Record<string, unknown>[],
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined
): Record<string, unknown>[] {
  if (!sortBy) return rows
  const order = sortOrder === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = a[sortBy]
    const bv = b[sortBy]
    if (av === bv) return 0
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * order
    }
    return String(av).localeCompare(String(bv)) * order
  })
}

// ============================================================================
// Sub-components
// ============================================================================

function ChartLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  )
}

function EmptyDataMessage() {
  return (
    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
      No data available
    </div>
  )
}

interface ChartControlsProps {
  columns: string[]
  numericColumns: string[]
  xKey: string
  yKeys: string[]
  sortBy: string | undefined
  sortOrder: 'asc' | 'desc' | undefined
  chartType: ChartType
  onXKeyChange: (val: string) => void
  onYKeyChange: (val: string) => void
  onSortChange: (val: string) => void
}

function ChartControls({
  columns,
  numericColumns,
  xKey,
  yKeys,
  sortBy,
  sortOrder,
  chartType,
  onXKeyChange,
  onYKeyChange,
  onSortChange,
}: ChartControlsProps) {
  // Number and table chart types don't need axis controls
  if (chartType === 'number' || chartType === 'table') return null

  const sortValue = sortBy && sortOrder ? `${sortBy}:${sortOrder}` : '__none__'

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {/* X axis */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground whitespace-nowrap">X axis</span>
        <Select value={xKey} onValueChange={onXKeyChange}>
          <SelectTrigger className="h-7 text-xs w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columns.map((col) => (
              <SelectItem key={col} value={col} className="text-xs">
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Y axis */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground whitespace-nowrap">Y axis</span>
        <Select value={yKeys[0] ?? ''} onValueChange={onYKeyChange}>
          <SelectTrigger className="h-7 text-xs w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(numericColumns.length > 0 ? numericColumns : columns).map(
              (col) => (
                <SelectItem key={col} value={col} className="text-xs">
                  {col}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground whitespace-nowrap">Sort</span>
        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger className="h-7 text-xs w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-xs">
              No sort
            </SelectItem>
            {columns.flatMap((col) => [
              <SelectItem
                key={`${col}:asc`}
                value={`${col}:asc`}
                className="text-xs"
              >
                {col} asc
              </SelectItem>,
              <SelectItem
                key={`${col}:desc`}
                value={`${col}:desc`}
                className="text-xs"
              >
                {col} desc
              </SelectItem>,
            ])}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface BarChartViewProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
}

function BarChartView({ data, xKey, yKeys }: BarChartViewProps) {
  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        yKeys.map((key, i) => [
          key,
          { label: key, color: `hsl(var(--chart-${(i % 5) + 1}))` },
        ])
      ),
    [yKeys]
  )

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const s = String(v)
            return s.length > 12 ? `${s.slice(0, 12)}…` : s
          }}
        />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {yKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`var(--color-${key})`}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AgentVisualization renders tool query results with interactive chart and
 * data/query tabs. Supports bar, line, area, pie, number, and table views.
 */
export function AgentVisualization({
  title,
  sql,
  rows,
  columns,
  rowCount,
  viz,
  className,
}: AgentVisualizationProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'data' | 'query'>(
    'chart'
  )
  const [chartType, setChartType] = useState<ChartType>(viz.chartType)
  const [xKey, setXKey] = useState<string>(viz.xKey)
  const [yKeys, setYKeys] = useState<string[]>(viz.yKeys)
  const [sortBy, setSortBy] = useState<string | undefined>(viz.sortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(
    viz.sortOrder
  )

  // Derive numeric columns from rows sample
  const numericColumns = useMemo(
    () => columns.filter((col) => isNumericColumn(rows, col)),
    [columns, rows]
  )

  // Sorted data for chart rendering
  const sortedRows = useMemo(
    () => sortRows(rows, sortBy, sortOrder),
    [rows, sortBy, sortOrder]
  )

  // QueryConfig for DataTable
  const queryConfig = useMemo<QueryConfig<string[]>>(
    () => ({
      name: 'agent-viz-result',
      description: title ?? 'Query results from AI agent',
      sql,
      columns: columns as string[],
    }),
    [title, sql, columns]
  )

  const handleSortChange = useCallback((val: string) => {
    if (val === '__none__') {
      setSortBy(undefined)
      setSortOrder(undefined)
    } else {
      const [col, order] = val.split(':')
      setSortBy(col)
      setSortOrder(order as 'asc' | 'desc')
    }
  }, [])

  const handleYKeyChange = useCallback((val: string) => {
    setYKeys([val])
  }, [])

  const handleDownload = useCallback(() => {
    exportToCsv(
      rows,
      title ? `${title.replace(/\s+/g, '-').toLowerCase()}.csv` : undefined
    )
  }, [rows, title])

  const hasData = rows.length > 0

  const renderChart = () => {
    if (!hasData) return <EmptyDataMessage />

    try {
      if (chartType === 'table') {
        return (
          <DataTable
            data={rows.slice(0, 100) as Record<string, unknown>[]}
            queryConfig={queryConfig}
            context={{}}
            defaultPageSize={Math.min(rows.length, 25)}
            showSQL={false}
            enableColumnFilters={false}
            enableColumnReordering={false}
            compact
          />
        )
      }

      if (chartType === 'number') {
        return (
          <Suspense fallback={<ChartLoadingSkeleton />}>
            <NumberChart
              data={sortedRows as Record<string, string | number>[]}
              nameKey={xKey}
              dataKey={yKeys[0] ?? columns[0] ?? ''}
              title={title}
            />
          </Suspense>
        )
      }

      if (chartType === 'pie') {
        return (
          <Suspense fallback={<ChartLoadingSkeleton />}>
            <DonutChart
              data={sortedRows}
              index={xKey}
              category={yKeys[0] ?? columns[0] ?? ''}
              readable={viz.readable}
              showLegend
              innerRadius={50}
              outerRadius={75}
            />
          </Suspense>
        )
      }

      if (chartType === 'bar') {
        return (
          <BarChartView
            data={sortedRows}
            xKey={xKey}
            yKeys={yKeys.length > 0 ? yKeys : [columns[1] ?? columns[0] ?? '']}
          />
        )
      }

      // area / line
      return (
        <Suspense fallback={<ChartLoadingSkeleton />}>
          <AreaChartPrimitive
            data={sortedRows}
            index={xKey}
            categories={
              yKeys.length > 0 ? yKeys : [columns[1] ?? columns[0] ?? '']
            }
            showXAxis
            showYAxis
            showCartesianGrid
            stack={false}
            opacity={chartType === 'line' ? 0 : 0.5}
            className="h-48"
          />
        </Suspense>
      )
    } catch {
      return (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          Unable to render chart
        </div>
      )
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b">
        <BarChart3Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        {title && (
          <span className="text-sm font-semibold truncate max-w-[200px]">
            {title}
          </span>
        )}
        <Badge variant="secondary" className="text-xs shrink-0">
          {rowCount} rows
        </Badge>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Chart type selector */}
          <Select
            value={chartType}
            onValueChange={(v) => setChartType(v as ChartType)}
          >
            <SelectTrigger className="h-7 text-xs w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CHART_TYPE_LABELS) as [ChartType, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {/* Download button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownload}
            title="Download CSV"
            disabled={!hasData}
          >
            <DownloadIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="p-3 pt-2 gap-0"
      >
        <TabsList className="h-7 mb-2">
          <TabsTrigger value="chart" className="text-xs px-2.5 h-6">
            Chart
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs px-2.5 h-6">
            Data
          </TabsTrigger>
          <TabsTrigger value="query" className="text-xs px-2.5 h-6">
            Query
          </TabsTrigger>
        </TabsList>

        {/* Chart tab */}
        <TabsContent value="chart">
          <ChartControls
            columns={columns}
            numericColumns={numericColumns}
            xKey={xKey}
            yKeys={yKeys}
            sortBy={sortBy}
            sortOrder={sortOrder}
            chartType={chartType}
            onXKeyChange={setXKey}
            onYKeyChange={handleYKeyChange}
            onSortChange={handleSortChange}
          />
          {renderChart()}
        </TabsContent>

        {/* Data tab */}
        <TabsContent value="data">
          {hasData ? (
            <DataTable
              data={rows.slice(0, 100) as Record<string, unknown>[]}
              queryConfig={queryConfig}
              context={{}}
              defaultPageSize={Math.min(rows.length, 25)}
              showSQL={false}
              enableColumnFilters={false}
              enableColumnReordering={false}
              compact
              footnote={
                rows.length > 100
                  ? `Showing 100 of ${rowCount} rows`
                  : undefined
              }
            />
          ) : (
            <EmptyDataMessage />
          )}
        </TabsContent>

        {/* Query tab */}
        <TabsContent value="query">
          <CodeBlock code={sql} language="sql">
            <CodeBlockCopyButton />
          </CodeBlock>
        </TabsContent>
      </Tabs>
    </div>
  )
}
