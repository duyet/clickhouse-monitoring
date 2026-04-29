'use client'

import { BarChart3Icon, DownloadIcon, Loader2Icon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts'

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
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'number' | 'table' | 'combo'
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
  combo: 'Combo',
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
  const value = sample[col]
  if (typeof value === 'number') return true
  if (typeof value !== 'string' || value.trim() === '') return false
  return !Number.isNaN(Number(value))
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
  rowCount: number
  numberRowIndex: number
  stacked: boolean
  logScale: boolean
  rightAxisKeys: Set<string>
  onXKeyChange: (val: string) => void
  onYKeyChange: (val: string) => void
  onSortChange: (val: string) => void
  onNumberRowIndexChange: (val: number) => void
  onStackedChange: (val: boolean) => void
  onLogScaleChange: (val: boolean) => void
  onRightAxisKeysChange: (val: Set<string>) => void
}

function ChartControls({
  columns,
  numericColumns,
  xKey,
  yKeys,
  sortBy,
  sortOrder,
  chartType,
  rowCount,
  numberRowIndex,
  stacked,
  logScale,
  rightAxisKeys,
  onXKeyChange,
  onYKeyChange,
  onSortChange,
  onNumberRowIndexChange,
  onStackedChange,
  onLogScaleChange,
  onRightAxisKeysChange,
}: ChartControlsProps) {
  // Table chart type doesn't need controls
  if (chartType === 'table') return null

  // Number chart type: show column and row selectors
  if (chartType === 'number') {
    return (
      <div className="flex flex-wrap gap-2 pb-2">
        {/* Column selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground whitespace-nowrap">
            Column
          </span>
          <Select value={yKeys[0] ?? ''} onValueChange={onYKeyChange}>
            <SelectTrigger className="h-7 text-xs w-[140px]">
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

        {/* Row selector */}
        {rowCount > 1 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground whitespace-nowrap">Row</span>
            <Select
              value={String(numberRowIndex)}
              onValueChange={(v) => onNumberRowIndexChange(Number(v))}
            >
              <SelectTrigger className="h-7 text-xs w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: Math.min(rowCount, 50) }, (_, i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Label column selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground whitespace-nowrap">Label</span>
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
      </div>
    )
  }

  const sortValue = sortBy && sortOrder ? `${sortBy}:${sortOrder}` : '__none__'

  return (
    <>
      <div className="flex flex-wrap gap-2 pb-2">
        {/* X axis */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground whitespace-nowrap">
            X axis
          </span>
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
          <span className="text-muted-foreground whitespace-nowrap">
            Y axis
          </span>
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

        {/* Stacked toggle (bar and area) */}
        {(chartType === 'bar' || chartType === 'area') && yKeys.length > 1 && (
          <button
            onClick={() => onStackedChange(!stacked)}
            className={cn(
              'h-7 px-2 rounded-md border text-xs transition-colors',
              stacked
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-input hover:bg-muted'
            )}
          >
            Stacked
          </button>
        )}

        {/* Log scale toggle */}
        {chartType !== 'pie' && (
          <button
            onClick={() => onLogScaleChange(!logScale)}
            className={cn(
              'h-7 px-2 rounded-md border text-xs transition-colors',
              logScale
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-input hover:bg-muted'
            )}
          >
            Log
          </button>
        )}
      </div>
      {/* Combo chart: axis assignment per Y key */}
      {chartType === 'combo' && numericColumns.length > 1 && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {numericColumns
            .filter((col) => col !== xKey)
            .map((col) => {
              const isRight = rightAxisKeys.has(col)
              return (
                <button
                  key={col}
                  onClick={() => {
                    const next = new Set(rightAxisKeys)
                    if (isRight) next.delete(col)
                    else next.add(col)
                    onRightAxisKeysChange(next)
                  }}
                  className={cn(
                    'h-6 px-2 rounded border text-[11px] transition-colors',
                    isRight
                      ? 'bg-blue-500/15 text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700'
                      : 'bg-muted/50 text-muted-foreground border-input hover:bg-muted'
                  )}
                  title={
                    isRight
                      ? `${col}: right axis (line)`
                      : `${col}: left axis (bar)`
                  }
                >
                  {col} {isRight ? '(R)' : '(L)'}
                </button>
              )
            })}
        </div>
      )}
    </>
  )
}

interface BarChartViewProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  stacked?: boolean
  logScale?: boolean
}

function BarChartView({
  data,
  xKey,
  yKeys,
  stacked,
  logScale,
}: BarChartViewProps) {
  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        yKeys.map((key, i) => [
          key,
          { label: key, color: `var(--chart-${(i % 5) + 1})` },
        ])
      ),
    [yKeys]
  )

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" yAxisId="left" />
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
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          scale={logScale ? 'log' : 'auto'}
          domain={logScale ? ['auto', 'auto'] : undefined}
          allowDataOverflow={logScale}
        />
        <ChartTooltip axisId="left" content={<ChartTooltipContent />} />
        {yKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`var(--color-${key})`}
            radius={[2, 2, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

interface ComboChartViewProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  rightAxisKeys: Set<string>
  logScale?: boolean
}

function ComboChartView({
  data,
  xKey,
  yKeys,
  rightAxisKeys,
  logScale,
}: ComboChartViewProps) {
  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        yKeys.map((key, i) => [
          key,
          { label: key, color: `var(--chart-${(i % 5) + 1})` },
        ])
      ),
    [yKeys]
  )

  const leftKeys = yKeys.filter((k) => !rightAxisKeys.has(k))
  const rightKeys = yKeys.filter((k) => rightAxisKeys.has(k))

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <ComposedChart
        data={data}
        margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
      >
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
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          scale={logScale ? 'log' : 'auto'}
          domain={logScale ? ['auto', 'auto'] : undefined}
        />
        {rightKeys.length > 0 && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        {leftKeys.map((key) => (
          <Bar
            key={key}
            yAxisId="left"
            dataKey={key}
            fill={`var(--color-${key})`}
            radius={[2, 2, 0, 0]}
          />
        ))}
        {rightKeys.map((key) => (
          <Line
            key={key}
            yAxisId="right"
            type="monotone"
            dataKey={key}
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </ComposedChart>
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
  const [numberRowIndex, setNumberRowIndex] = useState(0)
  const [stacked, setStacked] = useState(false)
  const [logScale, setLogScale] = useState(false)
  const [rightAxisKeys, setRightAxisKeys] = useState<Set<string>>(new Set())

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
      sortedRows,
      title ? `${title.replace(/\s+/g, '-').toLowerCase()}.csv` : undefined
    )
  }, [sortedRows, title])

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
        const safeIndex = Math.min(numberRowIndex, sortedRows.length - 1)
        const numberData = [sortedRows[safeIndex]].filter(Boolean)
        return (
          <Suspense fallback={<ChartLoadingSkeleton />}>
            <NumberChart
              data={numberData as Record<string, string | number>[]}
              nameKey={xKey}
              dataKey={yKeys[0] ?? columns[0] ?? ''}
              title={title}
              showLabel
            />
          </Suspense>
        )
      }

      if (chartType === 'pie') {
        // Limit pie chart to top 10 slices for readability
        const pieValueKey = yKeys[0] ?? columns[0] ?? ''
        const pieSorted = [...sortedRows].sort(
          (a, b) =>
            (Number(b[pieValueKey]) || 0) - (Number(a[pieValueKey]) || 0)
        )
        const pieData = pieSorted.slice(0, 10)
        const showPieLegend = pieData.length <= 10

        return (
          <Suspense fallback={<ChartLoadingSkeleton />}>
            <DonutChart
              data={pieData}
              index={xKey}
              category={pieValueKey}
              readable={viz.readable}
              showLegend={showPieLegend}
              showLabel
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
            stacked={stacked}
            logScale={logScale}
          />
        )
      }

      if (chartType === 'combo') {
        const comboYKeys =
          numericColumns.length > 1
            ? numericColumns.filter((col) => col !== xKey)
            : yKeys.length > 0
              ? yKeys
              : [columns[1] ?? columns[0] ?? '']
        return (
          <ComboChartView
            data={sortedRows}
            xKey={xKey}
            yKeys={comboYKeys}
            rightAxisKeys={rightAxisKeys}
            logScale={logScale}
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
            stack={stacked}
            opacity={chartType === 'line' ? 0 : 0.5}
            className="h-48"
          />
        </Suspense>
      )
    } catch (error) {
      console.error('AgentVisualization: Failed to render chart', error)
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
            rowCount={rows.length}
            numberRowIndex={numberRowIndex}
            stacked={stacked}
            logScale={logScale}
            rightAxisKeys={rightAxisKeys}
            onXKeyChange={setXKey}
            onYKeyChange={handleYKeyChange}
            onSortChange={handleSortChange}
            onNumberRowIndexChange={setNumberRowIndex}
            onStackedChange={setStacked}
            onLogScaleChange={setLogScale}
            onRightAxisKeysChange={setRightAxisKeys}
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
