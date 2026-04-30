'use client'

import {
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2Icon,
  Maximize2Icon,
} from 'lucide-react'

import type { AgentDataSourcesProps } from '@/components/agents/agent-data-sources'
import type { AgentVisualizationProps } from '@/components/agents/agent-visualization'
import type { QueryConfig } from '@/types/query-config'

import { useEffect, useMemo, useState } from 'react'
import { AgentChartRenderer } from '@/components/agents/agent-chart-renderer'
import { AgentDataSources } from '@/components/agents/agent-data-sources'
import { AgentVisualization } from '@/components/agents/agent-visualization'
import {
  AskUserWidget,
  isAskUserOutput,
} from '@/components/agents/ask-user-widget'
import { DataTable } from '@/components/data-table/data-table'
import { getToolMetadata } from '@/components/mcp/mcp-tools-data'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface AgentToolPart {
  readonly type: string
  readonly toolCallId: string
  readonly toolName?: string
  readonly state: string
  readonly input?: unknown
  readonly output?: unknown
  readonly errorText?: string
  readonly title?: string
}

interface ToolCallPartProps {
  readonly part: AgentToolPart
  readonly onToolResult?: (toolCallId: string, result: string) => void
}

function createResultQueryConfig(columns: string[]): QueryConfig<string[]> {
  return {
    name: 'agent-query-result',
    description: 'Query results from AI agent',
    sql: 'SELECT * FROM agent_result',
    columns,
  }
}

function getRowsFromOutput(output: unknown): Record<string, unknown>[] {
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0]
    if (typeof first === 'object' && first !== null) {
      return output as Record<string, unknown>[]
    }
  }

  if (typeof output === 'object' && output !== null) {
    const obj = output as Record<string, unknown>
    if (Array.isArray(obj.rows) && obj.rows.length > 0) {
      return obj.rows as Record<string, unknown>[]
    }
  }

  return []
}

function getPromotedOutputType(output: unknown) {
  if (typeof output !== 'object' || output === null) return null

  const outputObj = output as Record<string, unknown>
  if (outputObj.type === 'visualization' && Array.isArray(outputObj.rows)) {
    return 'visualization' as const
  }
  if (outputObj.type === 'data_sources' && Array.isArray(outputObj.sources)) {
    return 'data_sources' as const
  }

  return null
}

export function ResultTable({
  rows,
  maxRows = 100,
}: {
  readonly rows: readonly unknown[]
  readonly maxRows?: number
}) {
  const displayRows = rows.slice(0, maxRows) as Record<string, unknown>[]

  const columns = useMemo(() => {
    if (displayRows.length === 0) return []
    return Object.keys(displayRows[0])
  }, [displayRows])

  const queryConfig = useMemo(() => createResultQueryConfig(columns), [columns])

  if (columns.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No columns to display
      </div>
    )
  }

  const footnote =
    rows.length > maxRows ? `Showing ${maxRows} of ${rows.length} rows` : ' '

  return (
    <DataTable
      data={displayRows}
      queryConfig={queryConfig}
      context={{}}
      defaultPageSize={Math.min(displayRows.length, 25)}
      showSQL={false}
      enableColumnFilters={false}
      enableColumnReordering={false}
      compact
      footnote={footnote}
    />
  )
}

function ExpandTableButton({
  rows,
  queryConfig,
}: {
  readonly rows: Record<string, unknown>[]
  readonly queryConfig: QueryConfig<string[]>
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          title="Expand table"
          onClick={(event) => event.stopPropagation()}
        >
          <Maximize2Icon className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-[95vw] flex-col">
        <DialogHeader>
          <DialogTitle>Query Results ({rows.length} rows)</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto">
          <DataTable
            data={rows}
            queryConfig={queryConfig}
            context={{}}
            defaultPageSize={50}
            showSQL={false}
            enableColumnFilters={true}
            enableColumnReordering={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function renderToolOutput(output: unknown) {
  if (output == null) return null

  const outputObj = output as Record<string, unknown>

  if (outputObj.type === 'visualization' && Array.isArray(outputObj.rows)) {
    return (
      <AgentVisualization
        title={outputObj.title as string | undefined}
        sql={outputObj.sql as string}
        rows={outputObj.rows as Record<string, unknown>[]}
        columns={outputObj.columns as string[]}
        rowCount={outputObj.rowCount as number}
        viz={outputObj.viz as AgentVisualizationProps['viz']}
      />
    )
  }

  if (outputObj.type === 'data_sources' && Array.isArray(outputObj.sources)) {
    return (
      <AgentDataSources
        searchTerm={outputObj.searchTerm as string}
        sources={outputObj.sources as AgentDataSourcesProps['sources']}
      />
    )
  }

  if (Array.isArray(output) && output.length > 0) {
    const firstItem = output[0]
    if (typeof firstItem === 'object' && firstItem !== null) {
      return <ResultTable rows={output} maxRows={100} />
    }
  }

  if (
    outputObj.chartData &&
    Array.isArray(outputObj.chartData) &&
    outputObj.chartData.length > 0
  ) {
    return (
      <AgentChartRenderer
        type={
          (outputObj.chartType as 'area' | 'bar' | 'donut' | undefined) || 'bar'
        }
        data={outputObj.chartData as readonly Record<string, unknown>[]}
        title={outputObj.chartTitle as string | undefined}
        xKey={outputObj.xKey as string | undefined}
        yKey={outputObj.yKey as string | undefined}
        categories={outputObj.categories as string[] | undefined}
        readable={
          outputObj.readable as
            | 'bytes'
            | 'duration'
            | 'number'
            | 'quantity'
            | undefined
        }
      />
    )
  }

  if (Array.isArray(outputObj.rows) && outputObj.rows.length > 0) {
    return <ResultTable rows={outputObj.rows as unknown[]} maxRows={100} />
  }

  return (
    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
      {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
    </pre>
  )
}

export function ToolCallPart({ part, onToolResult }: ToolCallPartProps) {
  const toolName = part.toolName || part.type.replace('tool-', '')
  const isStarting =
    part.state === 'input-streaming' || part.state === 'input-available'
  const isStreaming = part.state === 'output-streaming'
  const hasOutput = part.state === 'output-available'
  const hasError = part.state === 'output-error'
  const shouldAutoExpand = isStreaming || hasError || isStarting
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand)

  useEffect(() => {
    if (shouldAutoExpand) setIsExpanded(true)
  }, [shouldAutoExpand])

  const inputParams = useMemo(() => {
    if (!part.input || typeof part.input !== 'object') return null
    return Object.entries(part.input as Record<string, unknown>)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ')
  }, [part.input])

  const toolParams = useMemo(() => {
    const tool = getToolMetadata(toolName)
    return tool?.params || []
  }, [toolName])

  const outputRows = useMemo(() => {
    if (!hasOutput || !part.output) return []
    return getRowsFromOutput(part.output)
  }, [hasOutput, part.output])

  const outputQueryConfig = useMemo(() => {
    if (outputRows.length === 0) return null
    return createResultQueryConfig(Object.keys(outputRows[0]))
  }, [outputRows])

  const promotedOutput = useMemo(() => {
    if (!hasOutput || part.output == null) return null
    return getPromotedOutputType(part.output)
  }, [hasOutput, part.output])

  return (
    <div className="my-2">
      <div className="overflow-hidden rounded-md border border-border/60 bg-muted/20">
        <button
          onClick={() => setIsExpanded((previous) => !previous)}
          className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/30"
        >
          <span className="shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronDownIcon className="h-3.5 w-3.5" />
            ) : (
              <ChevronRightIcon className="h-3.5 w-3.5" />
            )}
          </span>

          <div
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              isStarting && 'animate-pulse bg-yellow-500',
              isStreaming && 'animate-ping bg-yellow-400',
              hasOutput && 'bg-green-500',
              hasError && 'bg-red-500'
            )}
          />

          <div className="flex min-w-0 items-center gap-1.5">
            <span className="font-mono text-xs font-medium">{toolName}</span>
            {inputParams && (
              <span className="truncate font-mono text-xs text-muted-foreground/70">
                {inputParams}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {isStreaming && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] text-yellow-600"
              >
                Executing...
              </Badge>
            )}
            {hasOutput && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] text-green-600"
              >
                Done
              </Badge>
            )}
            {hasError && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] text-red-600"
              >
                Failed
              </Badge>
            )}
            {hasOutput && outputRows.length > 0 && outputQueryConfig && (
              <ExpandTableButton
                rows={outputRows}
                queryConfig={outputQueryConfig}
              />
            )}
          </div>
        </button>

        {isExpanded ? (
          <div className="bg-background/50">
            {isStreaming ? (
              <div className="px-2.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                    Executing {toolName}...
                  </span>
                </div>
              </div>
            ) : null}

            {hasOutput && part.output != null && !promotedOutput ? (
              <div className="px-1 py-1">
                {isAskUserOutput(part.output) && onToolResult ? (
                  <AskUserWidget
                    output={part.output}
                    toolCallId={part.toolCallId}
                    onSubmit={onToolResult}
                  />
                ) : (
                  renderToolOutput(part.output)
                )}
              </div>
            ) : null}

            {hasError && Boolean(part.errorText) ? (
              <div className="px-3 py-2 text-sm text-destructive">
                {String(part.errorText)}
              </div>
            ) : null}

            {part.input && typeof part.input === 'object' ? (
              <div className="border-t border-border/60 bg-muted/10 px-2.5 py-2">
                <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Parameters
                </div>
                <div className="space-y-1">
                  {Object.entries(part.input as Record<string, unknown>).map(
                    ([key, value]) => {
                      const paramDef = toolParams.find((p) => p.name === key)
                      const isOptional = paramDef?.required === false
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className={cn(
                              'font-mono',
                              isOptional
                                ? 'text-muted-foreground'
                                : 'font-medium text-foreground'
                            )}
                          >
                            {key}
                          </span>
                          <span className="text-muted-foreground">:</span>
                          <span className="font-mono text-muted-foreground">
                            {JSON.stringify(value)}
                          </span>
                          {isOptional ? (
                            <span className="text-[10px] text-muted-foreground/60">
                              (optional)
                            </span>
                          ) : null}
                        </div>
                      )
                    }
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasOutput && promotedOutput && part.output != null ? (
        <div className="mt-2">{renderToolOutput(part.output)}</div>
      ) : null}
    </div>
  )
}
