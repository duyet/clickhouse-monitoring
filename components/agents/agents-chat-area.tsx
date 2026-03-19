'use client'

'use no memo'

import {
  ActivityIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  DatabaseIcon,
  HardDriveIcon,
  Loader2Icon,
  Maximize2Icon,
  MergeIcon,
  PanelRightClose,
  PanelRightOpen,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
  TableIcon,
  TrashIcon,
  UserIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react'

import type { UIMessage } from 'ai'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import '@/styles/markdown-code.css'

import type { Conversation } from '@/lib/ai/agent/conversation-utils'
import type { QueryConfig } from '@/types/query-config'

import { AgentChartRenderer } from '@/components/agents/agent-chart-renderer'
import { AgentInsightCards } from '@/components/agents/agent-insight-cards'
import {
  ConversationContent,
  ConversationEmptyState,
  Conversation as ConversationUI,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from '@/components/ai-elements/task'
import { DataTable } from '@/components/data-table/data-table'
import { getToolMetadata } from '@/components/mcp/mcp-tools-data'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useConversationContext } from '@/lib/ai/agent/conversation-context'
import { getSavedModel } from '@/lib/hooks/use-agent-model'
import { getMessageStats } from '@/lib/hooks/use-agent-session-stats'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { useHostId } from '@/lib/swr'
import { cn, formatDuration } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface AgentsChatAreaRef {
  handleClear: () => void
}

interface AgentsChatAreaProps {
  readonly isSidebarOpen: boolean
  readonly onMenuClick: () => void
  readonly hideHeader?: boolean
  readonly hideCompactControls?: boolean
}

// Note: Chat state is managed internally by useChat when props are not provided.
// For external state management, messages are passed via props but types need to match exactly.

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Animated typing indicator with three bouncing dots
 */
function TypingIndicator() {
  return (
    <Message from="assistant">
      <MessageContent>
        <div className="flex items-center gap-1 py-2">
          <span className="flex gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce" />
          </span>
        </div>
      </MessageContent>
    </Message>
  )
}

/**
 * Enhanced result table using the full-featured DataTable component.
 * Supports sorting, pagination, column filtering, and virtualization for large datasets.
 */
function ResultTable({
  rows,
  maxRows = 100,
}: {
  readonly rows: readonly unknown[]
  readonly maxRows?: number
}) {
  const displayRows = rows.slice(0, maxRows) as Record<string, unknown>[]

  // Extract column names from first row
  const columns = useMemo(() => {
    if (displayRows.length === 0) return []
    return Object.keys(displayRows[0])
  }, [displayRows])

  // Dynamically build QueryConfig for the DataTable
  const queryConfig = useMemo<QueryConfig<string[]>>(
    () => ({
      name: 'agent-query-result',
      description: 'Query results from AI agent',
      sql: 'SELECT * FROM agent_result',
      columns: columns as string[],
    }),
    [columns]
  )

  if (columns.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4 text-sm">
        No columns to display
      </div>
    )
  }

  return (
    <>
      <DataTable
        data={displayRows}
        queryConfig={queryConfig}
        context={{}}
        defaultPageSize={Math.min(displayRows.length, 25)}
        showSQL={false}
        enableColumnFilters={false}
        enableColumnReordering={false}
        compact
      />
      {/* Footer: row count */}
      <div className="px-2 py-1.5 border-t border-muted/30 text-[11px] text-muted-foreground">
        {rows.length > maxRows
          ? `Showing ${maxRows} of ${rows.length} rows`
          : `${displayRows.length} ${displayRows.length === 1 ? 'row' : 'rows'}`}
      </div>
    </>
  )
}

/**
 * Renders a single tool invocation part from the AI SDK UIMessage
 * with toggleable content for cleaner UI
 */
function ToolCallPart({
  part,
}: {
  readonly part: {
    type: string
    toolCallId: string
    toolName?: string
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
    title?: string
  }
}) {
  const toolName = part.toolName || part.type.replace('tool-', '')

  // Determine state
  const isStarting =
    part.state === 'input-streaming' || part.state === 'input-available'
  const isStreaming = part.state === 'output-streaming'
  const hasOutput = part.state === 'output-available'
  const hasError = part.state === 'output-error'

  // Track expanded state directly, auto-expand during streaming/error
  const shouldAutoExpand = isStreaming || hasError || isStarting
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand)

  // Auto-expand when tool starts streaming or errors
  useEffect(() => {
    if (shouldAutoExpand) setIsExpanded(true)
  }, [shouldAutoExpand])

  const toggleExpanded = () => setIsExpanded((prev) => !prev)

  // Format input parameters as muted inline text (e.g., "hostId=0")
  const inputParams = useMemo(() => {
    if (!part.input || typeof part.input !== 'object') return null

    const inputObj = part.input as Record<string, unknown>
    const entries = Object.entries(inputObj)

    // For single param like hostId, show "hostId=0"
    // For multiple params, join with ", "
    const params = entries
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ')

    return params
  }, [part.input])

  // Get tool parameter info for optional display
  const toolParams = useMemo(() => {
    const tool = getToolMetadata(toolName)
    return tool?.params || []
  }, [toolName])

  // Extract rows from output for the expand button in the header
  const { outputRows, outputQueryConfig } = useMemo(() => {
    if (!hasOutput || !part.output)
      return {
        outputRows: [] as Record<string, unknown>[],
        outputQueryConfig: null,
      }

    let rows: Record<string, unknown>[] = []

    // Direct array output
    if (Array.isArray(part.output) && part.output.length > 0) {
      const first = part.output[0]
      if (typeof first === 'object' && first !== null) {
        rows = part.output as Record<string, unknown>[]
      }
    }

    // Object with rows property
    const obj = part.output as Record<string, unknown>
    if (Array.isArray(obj.rows) && obj.rows.length > 0) {
      rows = obj.rows as Record<string, unknown>[]
    }

    if (rows.length === 0)
      return {
        outputRows: [] as Record<string, unknown>[],
        outputQueryConfig: null,
      }

    const columns = Object.keys(rows[0])
    const qc: QueryConfig<string[]> = {
      name: 'agent-query-result',
      description: 'Query results from AI agent',
      sql: 'SELECT * FROM agent_result',
      columns,
    }
    return { outputRows: rows, outputQueryConfig: qc }
  }, [hasOutput, part.output])

  return (
    <div className="my-2 overflow-hidden rounded-md border border-border/60 bg-muted/20">
      {/* Tool header - clickable to toggle */}
      <button
        onClick={toggleExpanded}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/30"
      >
        {/* Expand/collapse icon */}
        <span className="shrink-0 text-muted-foreground">
          {isExpanded ? (
            <ChevronDownIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5" />
          )}
        </span>

        {/* Status indicator */}
        <div
          className={cn(
            'h-2 w-2 rounded-full shrink-0',
            isStarting && 'bg-yellow-500 animate-pulse',
            isStreaming && 'bg-yellow-400 animate-ping',
            hasOutput && 'bg-green-500',
            hasError && 'bg-red-500'
          )}
        />

        {/* Tool name with muted input params */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium font-mono">{toolName}</span>
          {inputParams && (
            <span className="text-xs text-muted-foreground/70 font-mono truncate">
              {inputParams}
            </span>
          )}
        </div>

        {/* Status badge + expand button */}
        <div className="ml-auto flex items-center gap-1.5">
          {isStreaming && (
            <Badge
              variant="outline"
              className="text-[10px] text-yellow-600 shrink-0"
            >
              Executing...
            </Badge>
          )}
          {hasOutput && (
            <Badge
              variant="outline"
              className="text-[10px] text-green-600 shrink-0"
            >
              ✓ Done
            </Badge>
          )}
          {hasError && (
            <Badge
              variant="outline"
              className="text-[10px] text-red-600 shrink-0"
            >
              ✗ Failed
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

      {/* Collapsible content */}
      {isExpanded ? (
        <div className="bg-background/50">
          {/* Streaming state */}
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

          {/* Tool output */}
          {hasOutput && part.output != null ? (
            <div className="px-1 py-1">{renderToolOutput(part.output)}</div>
          ) : null}

          {/* Tool error */}
          {hasError && Boolean(part.errorText) ? (
            <div className="px-3 py-2 text-sm text-destructive">
              {String(part.errorText)}
            </div>
          ) : null}

          {/* Input parameters with optional indicators */}
          {part.input && typeof part.input === 'object' ? (
            <div className="border-t border-border/60 bg-muted/10 px-2.5 py-2">
              <div className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
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
                              : 'text-foreground font-medium'
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
  )
}

/**
 * Expand button for result tables — opens a full-screen dialog with the data
 */
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
          onClick={(e) => e.stopPropagation()}
        >
          <Maximize2Icon className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-[95vw] flex-col">
        <DialogHeader>
          <DialogTitle>Query Results ({rows.length} rows)</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0">
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

function renderToolOutput(output: unknown) {
  if (output == null) return null

  // Handle direct array output (e.g., list_databases, list_tables, get_table_schema)
  if (Array.isArray(output) && output.length > 0) {
    const firstItem = output[0] as Record<string, unknown>
    if (typeof firstItem === 'object' && firstItem !== null) {
      return <ResultTable rows={output as unknown[]} maxRows={100} />
    }
  }

  const outputObj = output as Record<string, unknown>

  // Check if output has chart data
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

  // Check if output has rows (query result)
  if (Array.isArray(outputObj.rows) && outputObj.rows.length > 0) {
    return <ResultTable rows={outputObj.rows as unknown[]} maxRows={100} />
  }

  // Default: render as JSON
  return (
    <pre className="text-xs whitespace-pre-wrap break-all max-h-48 overflow-auto font-mono text-muted-foreground">
      {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
    </pre>
  )
}

/**
 * Checks if an assistant message has meaningful content (text with actual characters)
 */
function hasMeaningfulContent(message: UIMessage): boolean {
  if (message.role !== 'assistant') return false

  // Find text parts and check if any have meaningful content
  const textParts = message.parts.filter(
    (p): p is { type: 'text'; text: string } =>
      typeof p === 'object' && p !== null && 'type' in p && p.type === 'text'
  )

  return textParts.some((part) => {
    // Clean markdown and check for actual content
    const cleaned = part.text
      .replace(/```[\w]*\n?[\s\S]*?```/g, '') // Remove code blocks
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italic
      .replace(/`/g, '') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines
      .trim()

    return cleaned.length > 10 // Consider meaningful if more than 10 chars
  })
}

/**
 * Shows typing indicator during streaming when assistant response is minimal
 * Shows for both cases:
 * 1. User just sent a message (last message is from user, waiting for assistant)
 * 2. Assistant started streaming but hasn't produced meaningful content yet
 */
function StreamingTypingIndicator({
  messages,
}: {
  readonly messages: readonly UIMessage[]
}) {
  const lastMessage = messages[messages.length - 1]

  // Show typing indicator if:
  // 1. Last message is from user (waiting for assistant to start)
  // 2. Last message is from assistant but has no meaningful content yet
  const shouldShowTyping =
    !lastMessage ||
    lastMessage.role === 'user' ||
    (lastMessage.role === 'assistant' && !hasMeaningfulContent(lastMessage))

  if (!shouldShowTyping) return null

  return <TypingIndicator />
}

/**
 * Generates a stable key for a message part to avoid React remounting during streaming
 * Using message.id + part type + index ensures keys don't shift when parts are added
 */
function getStablePartKey(
  messageId: string,
  part: unknown,
  index: number
): string {
  const p = part as Record<string, unknown>

  // Tool parts have stable toolCallId
  if (
    p.type === 'dynamic-tool' ||
    (typeof p.type === 'string' && p.type.startsWith('tool-'))
  ) {
    return `msg-${messageId}-tool-${p.toolCallId as string}`
  }

  // Text parts: include index to ensure uniqueness across multiple text parts
  // This is necessary because incremental updates can add/remove text parts
  if (p.type === 'text') {
    return `msg-${messageId}-text-${index}`
  }

  // Step parts: use index (they're separators so position matters)
  if (p.type === 'step-start') {
    return `msg-${messageId}-step-${index}`
  }

  // Reasoning parts
  if (p.type === 'reasoning') {
    return `msg-${messageId}-reasoning-${index}`
  }

  // Fallback
  return `msg-${messageId}-part-${index}`
}

/**
 * Displays per-message statistics (tool calls, durations) at the bottom of assistant messages.
 * Only shown for completed assistant messages (not during streaming).
 */
function MessageStatsFooter({
  message,
  responseDurationMs,
}: {
  readonly message: UIMessage
  readonly responseDurationMs?: number
}) {
  const stats = useMemo(() => getMessageStats(message), [message])

  // Only show footer when there were actual tool calls
  if (stats.toolCallCount === 0) return null

  const parts: string[] = []

  if (responseDurationMs && responseDurationMs > 0) {
    parts.push(formatDuration(responseDurationMs))
  }

  parts.push(
    `${stats.toolCallCount} tool ${stats.toolCallCount === 1 ? 'call' : 'calls'}`
  )

  if (stats.totalToolDurationMs > 0) {
    parts.push(`${formatDuration(stats.totalToolDurationMs)} in tools`)
  }

  return (
    <div className="mt-2 pt-1.5 text-[11px] text-muted-foreground/60 select-none">
      {parts.join(' · ')}
    </div>
  )
}

/**
 * Renders a single UIMessage with its parts (text, tool calls, etc.)
 * Includes follow-up suggestions for assistant messages
 */
function ChatMessage({
  message,
  allMessages,
  isLastUserMessage,
  isStreaming,
  responseDurationMs,
  onRegenerate,
  onSuggestionClick,
}: {
  readonly message: UIMessage
  readonly allMessages: readonly UIMessage[]
  readonly isLastUserMessage?: boolean
  readonly isStreaming?: boolean
  readonly responseDurationMs?: number
  readonly onRegenerate?: () => void
  readonly onSuggestionClick?: (suggestion: string) => void
}) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // Generate follow-up suggestions for assistant messages with tool calls
  const followUpSuggestions = useMemo(() => {
    if (!isAssistant) return []
    return generateFollowUpSuggestions(message, allMessages)
  }, [message, allMessages, isAssistant])

  return (
    <Message from={isUser ? 'user' : 'assistant'}>
      <MessageContent>
        <div
          className={cn(
            'relative group',
            isLastUserMessage && isUser && onRegenerate && 'pr-8'
          )}
        >
          {message.parts.map((part, i) => {
            const stableKey = getStablePartKey(message.id, part, i)

            // Text part - render as markdown for assistant messages
            if (part.type === 'text') {
              // For user messages, use MessageResponse (plain text)
              if (isUser) {
                return (
                  <MessageResponse key={stableKey}>{part.text}</MessageResponse>
                )
              }

              // For assistant messages, check for task list pattern first
              const taskItems = extractTaskItems(part.text)
              if (taskItems.length > 0) {
                return (
                  <div key={stableKey} className="my-2">
                    <Task>
                      <TaskTrigger title="Tasks" />
                      <TaskContent>
                        {taskItems.map((item, idx) => (
                          <TaskItem key={idx}>{item}</TaskItem>
                        ))}
                      </TaskContent>
                    </Task>
                  </div>
                )
              }

              // For assistant messages, use markdown rendering
              return (
                <div key={stableKey} className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      // Custom table styling
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                          <table className="min-w-full border-collapse border border-border">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="border border-border px-3 py-2 text-left text-sm font-medium">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-border px-3 py-2 text-sm">
                          {children}
                        </td>
                      ),
                      // Code block styling
                      pre: ({ children }) => (
                        <pre className="bg-muted rounded-md p-3 my-2 overflow-x-auto">
                          {children}
                        </pre>
                      ),
                      code: ({ className, children }) => {
                        // Check if this is inline code (no language class)
                        const isInline = !className || className === 'language-'
                        return isInline ? (
                          <code className="bg-muted px-1 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ) : (
                          <code className={className}>{children}</code>
                        )
                      },
                    }}
                  >
                    {part.text}
                  </ReactMarkdown>
                </div>
              )
            }

            // Reasoning part — display with the Reasoning collapsible component
            if (part.type === 'reasoning') {
              // AI SDK v6: ReasoningUIPart has { type: 'reasoning', text: string }
              const reasoningText = (
                part as unknown as { type: 'reasoning'; text: string }
              ).text
              return (
                <Reasoning key={stableKey} isStreaming={false}>
                  <ReasoningTrigger />
                  <ReasoningContent>{reasoningText}</ReasoningContent>
                </Reasoning>
              )
            }

            // Tool call part (dynamic tool - from our custom agent)
            if (part.type === 'dynamic-tool') {
              return <ToolCallPart key={stableKey} part={part as any} />
            }

            // Static typed tool call part (type starts with 'tool-')
            if (
              typeof part.type === 'string' &&
              part.type.startsWith('tool-')
            ) {
              return <ToolCallPart key={stableKey} part={part as any} />
            }

            // Step start part
            if (part.type === 'step-start') {
              return (
                <div
                  key={stableKey}
                  className="border-t border-muted/30 my-2"
                />
              )
            }

            return null
          })}

          {/* Refresh icon button - shown on hover for last user message */}
          {isLastUserMessage && isUser && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
              title="Regenerate response"
            >
              <RefreshCwIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Per-message stats footer for completed assistant messages */}
        {isAssistant && !isStreaming && (
          <MessageStatsFooter
            message={message}
            responseDurationMs={responseDurationMs}
          />
        )}

        {/* Follow-up suggestions for assistant messages */}
        {isAssistant && followUpSuggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-muted/30">
            <Suggestions>
              {followUpSuggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={onSuggestionClick}
                />
              ))}
            </Suggestions>
          </div>
        )}
      </MessageContent>
    </Message>
  )
}

// ============================================================================
// Task List Extraction
// ============================================================================

/**
 * Extract task items from markdown-style task lists.
 * Returns non-empty array only when the text is *primarily* a task list
 * (3+ items, >50% of non-empty lines are task list entries).
 */
function extractTaskItems(text: string): string[] {
  const taskPattern = /^[\s]*-\s+\[[ xX]\]\s+(.+)$/gm
  const matches = [...text.matchAll(taskPattern)]
  if (matches.length < 3) return []

  // Require majority of content to be task items
  const nonEmptyLines = text.split('\n').filter((l) => l.trim().length > 0)
  if (matches.length < nonEmptyLines.length * 0.5) return []

  return matches.map((m) => m[1].trim())
}

// ============================================================================
// Follow-up Suggestions
// ============================================================================

/**
 * Generates contextual follow-up suggestions based on the assistant message
 * Analyzes tool outputs and conversation context to provide relevant next actions
 */
function generateFollowUpSuggestions(
  message: UIMessage,
  _allMessages: readonly UIMessage[]
): string[] {
  const suggestions: string[] = []

  // Get tool names that were used in this message
  const toolNames: string[] = []
  for (const part of message.parts) {
    if (typeof part === 'object' && part !== null) {
      if ('type' in part) {
        const partType = (part as { type: string }).type
        if (partType === 'dynamic-tool') {
          const toolName = (part as { toolName?: string }).toolName
          if (toolName) toolNames.push(toolName)
        } else if (
          typeof partType === 'string' &&
          partType.startsWith('tool-')
        ) {
          toolNames.push(partType.replace(/^tool-/, ''))
        }
      }
    }
  }

  // Generate suggestions based on tools used
  if (toolNames.includes('query')) {
    suggestions.push('Explain the query results in more detail')
    suggestions.push('Export this data to CSV')
    suggestions.push('Create a chart from this data')
  }

  if (toolNames.includes('list_tables')) {
    suggestions.push('Show me the schema of a specific table')
    suggestions.push('What are the largest tables by disk usage?')
    suggestions.push('Which tables have the most rows?')
  }

  if (toolNames.includes('list_databases')) {
    suggestions.push('Show tables in a specific database')
    suggestions.push('Which database has the most tables?')
    suggestions.push('What is the total size of all databases?')
  }

  if (toolNames.includes('get_slow_queries')) {
    suggestions.push('Show me the query patterns for slow queries')
    suggestions.push('What are the most common slow query types?')
    suggestions.push('Are there any queries that should be optimized?')
  }

  if (toolNames.includes('get_running_queries')) {
    suggestions.push('Which queries are using the most memory?')
    suggestions.push('Kill a specific long-running query')
    suggestions.push('Show query execution progress')
  }

  if (toolNames.includes('get_table_schema')) {
    suggestions.push('Show sample data from this table')
    suggestions.push('What indexes exist on this table?')
    suggestions.push('Who is querying this table?')
  }

  if (toolNames.includes('get_metrics')) {
    suggestions.push('Show me the historical metrics trend')
    suggestions.push('What is the memory usage breakdown?')
    suggestions.push('Are there any performance anomalies?')
  }

  if (toolNames.includes('get_merge_status')) {
    suggestions.push('Which tables have the largest merged parts?')
    suggestions.push('Show merge performance over time')
    suggestions.push('Are there any stuck merges?')
  }

  // Add general follow-up if no specific suggestions
  if (suggestions.length === 0) {
    suggestions.push('Tell me more about this')
    suggestions.push('What are the key insights?')
  }

  // Return top 3-4 suggestions
  return suggestions.slice(0, 4)
}

// ============================================================================
// Default suggestions
// ============================================================================

interface DefaultSuggestion {
  text: string
  category: string
  icon: React.ReactNode
}

const DEFAULT_SUGGESTIONS: DefaultSuggestion[] = [
  {
    text: 'What databases are available and which ones have the most tables?',
    category: 'Schema',
    icon: <DatabaseIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'Show me the 10 largest tables and their disk usage',
    category: 'Storage',
    icon: <HardDriveIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'Which queries are running right now and how long have they been executing?',
    category: 'Querying',
    icon: <ActivityIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'What are the slowest queries from the past 24 hours?',
    category: 'Performance',
    icon: <ClockIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'How is the merge queue performing? Are there any large merges stuck?',
    category: 'Merges',
    icon: <MergeIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'What is the current CPU, memory, and disk usage of this server?',
    category: 'System',
    icon: <ZapIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'Show me replication lag across all replica tables',
    category: 'Replication',
    icon: <AlertCircleIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'Which users are consuming the most resources?',
    category: 'Access',
    icon: <UserIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'Are there any long-running queries that should be killed?',
    category: 'Operations',
    icon: <SquareIcon className="h-3.5 w-3.5" />,
  },
  {
    text: 'What are the most frequently accessed tables recently?',
    category: 'Usage',
    icon: <TableIcon className="h-3.5 w-3.5" />,
  },
]

const GETTING_STARTED_FEATURES = [
  'Live metrics',
  'Read-only analysis',
  'One-click prompts',
] as const

// ============================================================================
// Main Component
// ============================================================================

export const AgentsChatArea = forwardRef<
  AgentsChatAreaRef,
  AgentsChatAreaProps
>(function AgentsChatArea(
  {
    isSidebarOpen,
    onMenuClick,
    hideHeader = false,
    hideCompactControls = false,
  }: AgentsChatAreaProps,
  ref
) {
  // Get hostId from URL query params
  const hostId = useHostId()

  // Get conversation context for loading/saving messages
  const { conversations, currentConversationId, updateMessages } =
    useConversationContext()

  // Get the selected model from localStorage
  const model = useMemo(() => getSavedModel(), [])

  // Get disabled tools so the API can filter them out
  const { disabledTools } = useToolConfig()

  const { messages, sendMessage, setMessages, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/v1/agent',
      body: { hostId, model, disabledTools },
    }),
  })

  // Response timing: track when user sends a message and compute duration when streaming ends
  const sendTimestampRef = useRef<number>(0)
  const [responseDurations, setResponseDurations] = useState<
    Record<string, number>
  >({})
  const prevStatusRef = useRef<string>(status)

  // Capture send timestamp when status transitions to streaming
  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status

    // User just sent a message → mark start time
    if (
      prev === 'ready' &&
      (status === 'submitted' || status === 'streaming')
    ) {
      sendTimestampRef.current = Date.now()
    }

    // Streaming finished → compute duration for last assistant message
    if ((prev === 'streaming' || prev === 'submitted') && status === 'ready') {
      if (sendTimestampRef.current > 0 && messages.length > 0) {
        let lastAssistant: UIMessage | undefined
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'assistant') {
            lastAssistant = messages[i]
            break
          }
        }
        if (lastAssistant) {
          const duration = Date.now() - sendTimestampRef.current
          const id = lastAssistant.id
          setResponseDurations((prev) => ({ ...prev, [id]: duration }))
          sendTimestampRef.current = 0
        }
      }
    }
  }, [status, messages])

  // Ref to track last saved messages to avoid infinite loops
  const lastSavedMessagesRef = useRef<UIMessage[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Track previous conversation ID to detect conversation switches
  const prevConversationIdRef = useRef<string | undefined>(undefined)

  // Load messages ONLY when conversation ID changes (not on every message update)
  useEffect(() => {
    // Skip if no conversation or same conversation (not a switch)
    if (!currentConversationId) return
    if (currentConversationId === prevConversationIdRef.current) return

    const conversation = conversations.find(
      (c: Conversation) => c.id === currentConversationId
    )
    if (conversation) {
      const storedMsgs = conversation.messages
      // Load messages from storage when switching conversations
      setMessages(storedMsgs)
      setResponseDurations({})
      lastSavedMessagesRef.current = storedMsgs
    }

    // Update previous conversation ID
    prevConversationIdRef.current = currentConversationId
  }, [currentConversationId, conversations, setMessages])

  // Save messages to conversation when they change (debounced)
  useEffect(() => {
    if (!currentConversationId) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Check if messages actually changed (reference check)
    if (messages === lastSavedMessagesRef.current) return

    // Debounce save: wait 1s after last message change (or 100ms during streaming)
    const isStreaming = status === 'streaming'
    const debounceMs = isStreaming ? 100 : 1000

    saveTimeoutRef.current = setTimeout(() => {
      lastSavedMessagesRef.current = messages
      updateMessages(currentConversationId, messages)
    }, debounceMs)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [messages, currentConversationId, updateMessages, status])

  const isLoading = status === 'streaming' || status === 'submitted'
  const isEmpty = messages.length === 0

  const handleSubmit = useCallback(
    ({ text }: { text: string; files?: unknown[] }) => {
      if (!text.trim() || isLoading) return
      sendMessage({
        parts: [{ type: 'text', text: text.trim() }],
      })
    },
    [isLoading, sendMessage]
  )

  const handleClear = useCallback(() => {
    // Stop any active streaming first
    stop()

    // Cancel any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = undefined
    }

    // Clear messages state
    setMessages([])
    setResponseDurations({})

    // Clear messages in current conversation too
    if (currentConversationId) {
      updateMessages(currentConversationId, [])
      lastSavedMessagesRef.current = []
    }
  }, [stop, setMessages, currentConversationId, updateMessages])

  // Expose handleClear to parent via ref
  useImperativeHandle(ref, () => ({ handleClear }), [handleClear])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSubmit({ text: suggestion })
    },
    [handleSubmit]
  )

  const handleRegenerate = useCallback(() => {
    // Stop current generation
    stop()

    // Find the last user message using a backward loop (avoids copying the array)
    let lastUserMessage: UIMessage | undefined
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i]
        break
      }
    }

    if (lastUserMessage) {
      // Get text from the last user message
      const textPart = lastUserMessage.parts.find(
        (p): p is { type: 'text'; text: string } =>
          typeof p === 'object' &&
          p !== null &&
          'type' in p &&
          p.type === 'text'
      )

      if (textPart) {
        // Remove the last assistant response and user message, then resend
        const messagesWithoutLastExchange = messages.slice(
          0,
          messages.lastIndexOf(lastUserMessage)
        )
        setMessages(messagesWithoutLastExchange)

        // Resend the user message
        setTimeout(() => {
          sendMessage({
            parts: [{ type: 'text', text: textPart.text }],
          })
        }, 100)
      }
    }
  }, [messages, stop, sendMessage, setMessages])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header (hidden when in page-level layout) */}
      {!hideHeader && (
        <div className="flex items-center justify-between border-b px-3 sm:px-4 py-3 shrink-0">
          {/* Left: Toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-8 w-8 shrink-0"
            title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>

          {/* Center: AI Agent title */}
          <div className="flex items-center gap-2 min-w-0">
            <SparklesIcon className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-semibold truncate text-sm sm:text-base">
              AI Agent
            </h2>
          </div>

          {/* Right: Stop (when loading) and Clear */}
          <div className="flex items-center gap-1 shrink-0">
            {isLoading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={stop}
                className="h-8 w-8"
                title="Stop generation"
              >
                <SquareIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8"
              title="Clear conversation"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Compact controls bar (shown when header is hidden and not hidden by parent) */}
      {hideHeader &&
        !hideCompactControls &&
        (isLoading || messages.length > 0) && (
          <div className="flex items-center justify-end gap-1 px-3 py-2 border-b shrink-0">
            {isLoading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={stop}
                className="h-8 w-8"
                title="Stop generation"
              >
                <SquareIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8"
              title="Clear conversation"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

      {/* Messages Area */}
      <ConversationUI>
        <ConversationContent className="gap-4">
          {isEmpty ? (
            <ConversationEmptyState className="justify-start px-0 py-6 text-left sm:py-8">
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 sm:px-6">
                <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-background via-background to-muted/30">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-3">
                        <Badge
                          variant="outline"
                          className="rounded-full border-border/60 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
                        >
                          Agent workspace
                        </Badge>
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card">
                            <SparklesIcon className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                              Inspect your ClickHouse cluster in plain English
                            </h2>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                              Start with a live health signal or launch one of
                              the ready-made prompts below. Every card and
                              question sends directly to the agent.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[320px]">
                        {GETTING_STARTED_FEATURES.map((item) => (
                          <div
                            key={item}
                            className="rounded-lg border border-border/60 bg-background/70 px-2.5 py-2 text-xs font-medium text-muted-foreground"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <section className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                        Live cluster snapshot
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        These values are fetched from the current host and open
                        the matching investigation when clicked.
                      </p>
                    </div>
                  </div>
                  <AgentInsightCards onQuestionClick={handleSuggestionClick} />
                </section>

                <Card className="border-border/60 bg-muted/10">
                  <CardHeader className="space-y-2 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base tracking-tight sm:text-lg">
                          Suggested questions
                        </CardTitle>
                        <CardDescription className="max-w-2xl text-sm leading-6">
                          Use a starter prompt for schemas, storage, query
                          performance, and system health. You can keep iterating
                          from there.
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em]"
                      >
                        {DEFAULT_SUGGESTIONS.length} ready prompts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {DEFAULT_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.text}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="group flex h-full flex-col items-start rounded-xl border border-border/60 bg-background/80 p-3.5 text-left transition-all hover:border-border hover:bg-accent/20"
                        >
                          <div className="flex w-full items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground/80">
                              {suggestion.icon}
                            </span>
                            <div className="min-w-0 space-y-1">
                              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                {suggestion.category}
                              </div>
                              <div className="text-sm font-medium leading-6 text-foreground">
                                {suggestion.text}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Run this prompt</span>
                            <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ConversationEmptyState>
          ) : (
            <>
              {messages.map((message, index) => {
                // Find the last user message index
                const lastUserMessageIndex = messages.findLastIndex(
                  (m) => m.role === 'user'
                )
                const isLastUserMessage = index === lastUserMessageIndex

                // Check if this specific message is currently streaming
                // (last assistant message while status is streaming)
                const isMessageStreaming =
                  isLoading &&
                  message.role === 'assistant' &&
                  index === messages.length - 1

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    allMessages={messages}
                    isLastUserMessage={isLastUserMessage}
                    isStreaming={isMessageStreaming}
                    responseDurationMs={responseDurations[message.id]}
                    onRegenerate={
                      isLastUserMessage ? handleRegenerate : undefined
                    }
                    onSuggestionClick={handleSuggestionClick}
                  />
                )
              })}
              {/* Show typing indicator during streaming/submitted when assistant message is minimal */}
              {isLoading && <StreamingTypingIndicator messages={messages} />}
            </>
          )}
        </ConversationContent>
      </ConversationUI>

      {/* Error display */}
      {error && (
        <div className="px-3 sm:px-4 py-2 border-t shrink-0">
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-2">
              <span className="text-sm">{error.message}</span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  className="h-7 text-xs"
                >
                  <RefreshCwIcon className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-7 w-7"
                  title="Dismiss"
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-3 sm:p-4 shrink-0">
        <PromptInput onSubmit={handleSubmit} className="max-w-none">
          <PromptInputTextarea
            placeholder="Ask about your ClickHouse data... (Press Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
          />
          <PromptInputSubmit disabled={isLoading}>
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : null}
          </PromptInputSubmit>
        </PromptInput>
        {/* Regenerate button during streaming */}
        {isLoading && messages.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="h-7 text-xs"
            >
              <RefreshCwIcon className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
            <span className="text-xs text-muted-foreground">or</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              className="h-7 text-xs"
            >
              <SquareIcon className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})
