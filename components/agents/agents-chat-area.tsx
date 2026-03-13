'use client'

'use no memo'

import {
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2Icon,
  PanelRightClose,
  PanelRightOpen,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
  TrashIcon,
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
import { DataTable } from '@/components/data-table/data-table'
import { getToolMetadata } from '@/components/mcp/mcp-tools-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConversationContext } from '@/lib/ai/agent/conversation-context'
import { getSavedModel } from '@/lib/hooks/use-agent-model'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface AgentsChatAreaRef {
  handleClear: () => void
}

interface AgentsChatAreaProps {
  readonly hostId: number
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
      sql: 'SELECT * FROM agent_result', // Placeholder SQL for dynamic table
      columns: columns as string[],
      // No specific column formats - use default text rendering
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
    <div className="border rounded-md">
      <DataTable
        data={displayRows}
        queryConfig={queryConfig}
        context={{}}
        defaultPageSize={rows.length > 50 ? 25 : 10}
        showSQL={false}
        enableColumnFilters={true}
        enableColumnReordering={true}
      />
      {rows.length > maxRows && (
        <div className="text-center text-xs text-muted-foreground py-2 px-3 border-t bg-muted/30">
          Showing {maxRows} of {rows.length} rows
        </div>
      )}
    </div>
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

  // Use derived state for auto-expand behavior (no useState + useEffect needed)
  // Track if user manually toggled to closed
  const [userToggledClosed, setUserToggledClosed] = useState(false)
  const shouldAutoExpand = isStreaming || hasError || isStarting
  const isExpanded = shouldAutoExpand && !userToggledClosed

  // Toggle expand/collapse
  const toggleExpanded = () => setUserToggledClosed((prev) => !prev)

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

  return (
    <div className="my-3 rounded-lg border bg-muted/30 overflow-hidden">
      {/* Tool header - clickable to toggle */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center gap-2 px-3 py-3 hover:bg-muted/50 transition-colors text-left"
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

        {/* Status badge */}
        <div className="ml-auto flex items-center gap-2">
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
        </div>
      </button>

      {/* Collapsible content */}
      {isExpanded ? (
        <div className="bg-background/60">
          {/* Streaming state */}
          {isStreaming ? (
            <div className="px-3 py-3">
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
            <div className="max-h-96 overflow-auto">
              <div className="px-3 py-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Output
                </div>
                {renderToolOutput(part.output)}
              </div>
            </div>
          ) : null}

          {/* Tool error */}
          {hasError && Boolean(part.errorText) ? (
            <div className="px-3 py-2 text-sm text-destructive">
              {String(part.errorText)}
            </div>
          ) : null}

          {/* Input parameters with optional indicators */}
          {part.input && typeof part.input === 'object' ? (
            <div className="px-3 py-2 border-t bg-muted/20">
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

function renderToolOutput(output: unknown) {
  if (output == null) return null

  // Handle direct array output (e.g., list_databases, list_tables, get_table_schema)
  if (Array.isArray(output) && output.length > 0) {
    const firstItem = output[0] as Record<string, unknown>
    if (typeof firstItem === 'object' && firstItem !== null) {
      return (
        <div>
          <div className="text-xs text-muted-foreground mb-2">
            {output.length} {output.length === 1 ? 'row' : 'rows'}
          </div>
          <ResultTable rows={output as unknown[]} maxRows={100} />
        </div>
      )
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
    return (
      <div>
        <div className="text-xs text-muted-foreground mb-2">
          {String(outputObj.rowCount ?? '')} rows
          {Boolean(outputObj.duration) && (
            <span> · {String(outputObj.duration)}ms</span>
          )}
        </div>
        <ResultTable rows={outputObj.rows as unknown[]} maxRows={100} />
      </div>
    )
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

  // Fallback
  return `msg-${messageId}-part-${index}`
}

/**
 * Renders a single UIMessage with its parts (text, tool calls, etc.)
 */
function ChatMessage({
  message,
  isLastUserMessage,
  onRegenerate,
}: {
  readonly message: UIMessage
  readonly isLastUserMessage?: boolean
  readonly onRegenerate?: () => void
}) {
  const isUser = message.role === 'user'

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
      </MessageContent>
    </Message>
  )
}

// ============================================================================
// Default suggestions
// ============================================================================

const DEFAULT_SUGGESTIONS = [
  'What databases are available and which ones have the most tables?',
  'Show me the 10 largest tables and their disk usage',
  'Which queries are running right now and how long have they been executing?',
  'What are the slowest queries from the past 24 hours?',
  'How is the merge queue performing? Are there any large merges stuck?',
  'What is the current CPU, memory, and disk usage of this server?',
  'Show me replication lag across all replica tables',
  'Which users are consuming the most resources?',
  'Are there any long-running queries that should be killed?',
  'What are the most frequently accessed tables recently?',
]

// ============================================================================
// Main Component
// ============================================================================

export const AgentsChatArea = forwardRef<
  AgentsChatAreaRef,
  AgentsChatAreaProps
>(function AgentsChatArea(
  {
    hostId,
    isSidebarOpen,
    onMenuClick,
    hideHeader = false,
    hideCompactControls = false,
  }: AgentsChatAreaProps,
  ref
) {
  // Get conversation context for loading/saving messages
  const { conversations, currentConversationId, updateMessages } =
    useConversationContext()

  // Get the selected model from localStorage
  const model = useMemo(() => getSavedModel(), [])

  const { messages, sendMessage, setMessages, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/v1/agent',
      body: { hostId, model },
    }),
  })

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
    setMessages([])
    // Clear messages in current conversation too
    if (currentConversationId) {
      updateMessages(currentConversationId, [])
      lastSavedMessagesRef.current = []
    }
  }, [setMessages, currentConversationId, updateMessages])

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

    // Find the last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user')

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
            <SparklesIcon className="h-5 w-5 text-purple-500 shrink-0" />
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
            <ConversationEmptyState
              title="AI Agent"
              description="Ask questions about your data using natural language"
              icon={
                <SparklesIcon className="h-8 w-8 sm:h-12 sm:w-12 text-purple-500" />
              }
            >
              <div className="pt-6 px-4 sm:px-4 max-w-xl mx-auto w-full">
                <ul className="space-y-1">
                  {DEFAULT_SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md px-3 py-2 transition-colors"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
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

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLastUserMessage={isLastUserMessage}
                    onRegenerate={
                      isLastUserMessage ? handleRegenerate : undefined
                    }
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
        <div className="px-3 sm:px-4 py-2 text-sm text-destructive border-t shrink-0">
          Error: {error.message}
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
