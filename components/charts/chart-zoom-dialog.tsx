'use client'

import { Maximize2Icon } from 'lucide-react'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { DateRangeConfig, DateRangeValue } from '@/components/date-range'
import type { StaleError } from '@/lib/swr'
import type { ChartDataPoint } from '@/types/chart-data'
import type { QueryConfig } from '@/types/query-config'

import { useMemo, useState } from 'react'
import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { ChartStaleIndicator } from '@/components/charts/chart-stale-indicator'
import { DataTable } from '@/components/data-table/data-table'
import { DateRangeSelector } from '@/components/date-range'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface ChartZoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  sql?: string
  data?: ChartDataPoint[]
  metadata?: CardToolbarMetadata
  children: React.ReactNode
  dateRangeConfig?: DateRangeConfig
  currentRange?: string
  onRangeChange?: (range: DateRangeValue) => void
  staleError?: StaleError
  onRetry?: () => Promise<unknown>
  className?: string
}

export function ChartZoomDialog({
  open,
  onOpenChange,
  title,
  sql,
  data,
  metadata,
  children,
  dateRangeConfig,
  currentRange,
  onRangeChange,
  staleError,
  onRetry,
  className,
}: ChartZoomDialogProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'data' | 'query'>(
    'chart'
  )

  // Memoize QueryConfig for DataTable
  const queryConfig = useMemo<QueryConfig<string[]> | undefined>(() => {
    if (!data || data.length === 0) return undefined
    return {
      name: 'chart-data',
      description: title ?? 'Chart data',
      sql: sql ?? 'SELECT * FROM chart_data',
      columns: Object.keys(data[0]) as string[],
    }
  }, [data, sql, title])

  // Memoize formatted metadata for display
  const metadataItems = useMemo(
    () =>
      metadata
        ? [
            metadata.api && { label: 'API', value: metadata.api },
            metadata.duration !== undefined && {
              label: 'Duration',
              value: `${metadata.duration}ms`,
            },
            metadata.rows !== undefined && {
              label: 'Rows',
              value: String(metadata.rows),
            },
            metadata.clickhouseVersion && {
              label: 'Version',
              value: metadata.clickhouseVersion,
            },
            metadata.host && { label: 'Host', value: metadata.host },
            metadata.queryId && { label: 'Query ID', value: metadata.queryId },
          ].filter(Boolean)
        : [],
    [metadata]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="truncate flex-1">{title}</DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              {staleError && onRetry && (
                <ChartStaleIndicator error={staleError} onRetry={onRetry} />
              )}
              {dateRangeConfig && onRangeChange && (
                <DateRangeSelector
                  config={dateRangeConfig}
                  value={currentRange ?? dateRangeConfig.defaultValue}
                  onChange={onRangeChange}
                />
              )}
            </div>
          </div>
          {metadataItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {metadataItems.map((item, index) =>
                item ? (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className="font-mono font-medium">{item.value}</span>
                  </div>
                ) : null
              )}
            </div>
          )}
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 min-h-0 flex flex-col"
        >
          <div className="px-6 pt-2">
            <TabsList className="h-8">
              <TabsTrigger value="chart" className="text-xs h-7">
                Chart
              </TabsTrigger>
              {queryConfig && (
                <TabsTrigger value="data" className="text-xs h-7">
                  Data
                </TabsTrigger>
              )}
              {sql && (
                <TabsTrigger value="query" className="text-xs h-7">
                  Query
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent
            value="chart"
            className="flex-1 min-h-0 p-6 overflow-auto"
          >
            <div className={cn('h-full w-full', className)}>{children}</div>
          </TabsContent>

          {queryConfig && (
            <TabsContent
              value="data"
              className="flex-1 min-h-0 p-6 overflow-auto"
            >
              <DataTable
                data={data as Record<string, unknown>[]}
                queryConfig={queryConfig}
                context={{}}
                defaultPageSize={50}
                showSQL={false}
                enableColumnFilters={true}
                enableColumnReordering={false}
              />
            </TabsContent>
          )}

          {sql && (
            <TabsContent
              value="query"
              className="flex-1 min-h-0 p-6 overflow-auto"
            >
              <CodeBlock code={sql} language="sql">
                <CodeBlockCopyButton />
              </CodeBlock>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export interface ChartZoomButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function ChartZoomButton({
  onClick,
  disabled = false,
}: ChartZoomButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label="Zoom chart"
          className={cn(
            'size-6 rounded-full transition-opacity',
            'relative before:content-[""] before:absolute before:-inset-4',
            'opacity-0 group-hover:opacity-40 hover:!opacity-100'
          )}
        >
          <Maximize2Icon className="size-3.5" strokeWidth={2} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Open in dialog
      </TooltipContent>
    </Tooltip>
  )
}
