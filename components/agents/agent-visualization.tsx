'use client'

export interface AgentVisualizationProps {
  title?: string
  sql: string
  rows: Record<string, unknown>[]
  columns: string[]
  rowCount: number
  viz: {
    chartType: 'bar' | 'line' | 'area' | 'pie' | 'number' | 'table'
    xKey: string
    yKeys: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    readable?: 'bytes' | 'duration' | 'number' | 'quantity'
  }
}

export function AgentVisualization({
  title,
  rows,
  rowCount,
  viz,
}: AgentVisualizationProps) {
  return (
    <div className="rounded-md border p-4">
      <div className="text-sm font-medium">{title || 'Query Results'}</div>
      <div className="text-xs text-muted-foreground mt-1">
        {rowCount} rows · {viz.chartType} chart
      </div>
      <pre className="text-xs mt-2 max-h-48 overflow-auto">
        {JSON.stringify(rows.slice(0, 5), null, 2)}
      </pre>
    </div>
  )
}
