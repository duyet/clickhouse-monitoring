'use client'

import type { ChartDataPoint } from '@/types/chart-data'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface ChartDataTableProps {
  /** Chart data to display as table */
  data: ChartDataPoint[]
  /** Column definitions for the table */
  columns: Array<{
    key: string
    label: string
    /** Format function for the value */
    format?: (value: unknown) => string
    /** CSS class for the column cells */
    className?: string
  }>
  /** Optional title for the table section */
  title?: string
  /** Optional className for the table container */
  className?: string
  /** Maximum number of rows to display (for performance) */
  maxRows?: number
}

/**
 * ChartDataTable - Accessible data table alternative for charts
 *
 * Provides a text-based representation of chart data for screen readers
 * and users who cannot access visual charts. Should be hidden by default
 * with an option to toggle visibility.
 *
 * WCAG 2.1 Success Criterion 1.1.1: "Non-text Content"
 * https://www.w3.org/WAI/WCAG21/Understanding/non-text-content
 *
 * @example
 * ```tsx
 * function MyChart({ data }: ChartProps) {
 *   return (
 *     <div>
 *       <AreaChart data={data} />
 *       <ChartDataTable
 *         data={data}
 *         columns={[
 *           { key: 'time', label: 'Time' },
 *           { key: 'value', label: 'Count', format: (v) => String(v) },
 *         ]}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function ChartDataTable({
  data,
  columns,
  title,
  className,
  maxRows = 100,
}: ChartDataTableProps) {
  // Limit rows for performance with large datasets
  const displayData = useMemo(() => {
    if (data.length <= maxRows) return data
    return data.slice(0, maxRows)
  }, [data, maxRows])

  const hasMoreData = data.length > maxRows

  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          {title}
        </h3>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-2 text-left font-medium text-muted-foreground',
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, index) => (
              <tr
                key={index}
                className="border-t transition-colors hover:bg-muted/50"
              >
                {columns.map((col) => {
                  const value = (row as Record<string, unknown>)[col.key]
                  const formattedValue = col.format
                    ? col.format(value)
                    : String(value ?? '')

                  return (
                    <td
                      key={col.key}
                      className={cn('px-4 py-2', col.className)}
                    >
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMoreData && (
        <p className="text-xs text-muted-foreground mt-2">
          Showing {maxRows} of {data.length} rows. Data may be truncated.
        </p>
      )}
    </div>
  )
}

interface ChartSummaryProps {
  /** Brief description of the chart content */
  description: string
  /** Key insights from the chart */
  insights?: string[]
  /** Optional data summary (e.g., "Trending upward over time") */
  trend?: string
  /** Optional className */
  className?: string
}

/**
 * ChartSummary - Text summary of chart content for screen readers
 *
 * Provides a concise, screen reader-friendly description of what the chart
 * shows and any key insights. Use this alongside visual charts.
 *
 * @example
 * ```tsx
 * function MyChart({ data }: ChartProps) {
 *   const summary = {
 *     description: 'Query execution count over the last 24 hours',
 *     insights: ['Peak at 2pm with 150 queries', 'Average 75 queries per hour'],
 *     trend: 'Overall increasing trend',
 *   }
 *
 *   return (
 *     <>
 *       <AreaChart data={data} />
 *       <ChartSummary {...summary} className="sr-only" />
 *     </>
 *   )
 * }
 * ```
 */
export function ChartSummary({
  description,
  insights,
  trend,
  className,
}: ChartSummaryProps) {
  return (
    <div className={className}>
      <p className="text-sm">{description}</p>
      {trend && (
        <p className="text-sm text-muted-foreground mt-1">Trend: {trend}</p>
      )}
      {insights && insights.length > 0 && (
        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
          {insights.map((insight, index) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface VisuallyHiddenProps {
  /** Content to hide visually but keep available to screen readers */
  children: React.ReactNode
  /** Whether to apply the hidden class */
  hidden?: boolean
  /** Optional className to apply in addition to sr-only */
  className?: string
}

/**
 * VisuallyHidden - Hide content visually while keeping it accessible
 *
 * More explicit alternative to the sr-only utility class. Useful for
 * conditional content that should only be visible to screen readers.
 *
 * @example
 * ```tsx
 * <VisuallyHidden>
 *   <h2>Chart: Query performance over time</h2>
 * </VisuallyHidden>
 * <AreaChart data={data} />
 * ```
 */
export function VisuallyHidden({
  children,
  hidden = true,
  className,
}: VisuallyHiddenProps) {
  return <div className={cn(hidden && 'sr-only', className)}>{children}</div>
}
