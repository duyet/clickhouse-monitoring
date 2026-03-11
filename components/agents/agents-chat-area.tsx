'use client'

import { Loader2Icon, MenuIcon, SparklesIcon, TrashIcon } from 'lucide-react'

import type { UIMessage } from 'ai'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Suspense, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
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
import { Suggestion } from '@/components/ai-elements/suggestion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface AgentsChatAreaProps {
  readonly hostId: number
  readonly isMobile: boolean
  readonly onMenuClick: () => void
}

// ============================================================================
// Sub-components
// ============================================================================

function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-16 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

function ResultTable({ rows }: { readonly rows: readonly unknown[] }) {
  const displayRows = rows.slice(0, 100)
  const columns =
    displayRows.length > 0
      ? Object.keys(displayRows[0] as Record<string, unknown>)
      : []

  if (columns.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4 text-sm">
        No columns to display
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-1.5 text-left font-medium text-xs"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col} className="px-3 py-1.5 max-w-xs truncate text-xs">
                  {String((row as Record<string, unknown>)[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 100 && (
        <div className="text-center text-xs text-muted-foreground py-2">
          Showing 100 of {rows.length} rows
        </div>
      )}
    </div>
  )
}

/**
 * Renders a single tool invocation part from the AI SDK UIMessage
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
  const isLoading =
    part.state === 'input-streaming' || part.state === 'input-available'
  const hasOutput = part.state === 'output-available'
  const hasError = part.state === 'output-error'

  return (
    <div className="my-2 rounded-lg border bg-muted/30 overflow-hidden">
      {/* Tool header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            isLoading && 'bg-yellow-500 animate-pulse',
            hasOutput && 'bg-green-500',
            hasError && 'bg-red-500'
          )}
        />
        <span className="text-xs font-medium font-mono">{toolName}</span>
        <Badge variant="outline" className="text-[10px] ml-auto">
          {String(part.state)}
        </Badge>
      </div>

      {/* Tool input */}
      {Boolean(part.input) && (
        <div className="px-3 py-2 border-b">
          <div className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            Input
          </div>
          <pre className="text-xs whitespace-pre-wrap break-all max-h-32 overflow-auto font-mono text-muted-foreground">
            {typeof part.input === 'string'
              ? part.input
              : JSON.stringify(part.input as Record<string, unknown>, null, 2)}
          </pre>
        </div>
      )}

      {/* Tool output */}
      {hasOutput && Boolean(part.output) && (
        <div className="px-3 py-2">
          <div className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            Output
          </div>
          {renderToolOutput(part.output)}
        </div>
      )}

      {/* Tool error */}
      {hasError && Boolean(part.errorText) && (
        <div className="px-3 py-2 text-sm text-destructive">
          {String(part.errorText)}
        </div>
      )}
    </div>
  )
}

function renderToolOutput(output: unknown) {
  if (!output) return null

  // Check if output has rows (query result)
  const outputObj = output as Record<string, unknown>
  if (Array.isArray(outputObj.rows) && outputObj.rows.length > 0) {
    return (
      <div>
        <div className="text-xs text-muted-foreground mb-2">
          {String(outputObj.rowCount ?? '')} rows
          {Boolean(outputObj.duration) && (
            <span> · {String(outputObj.duration)}ms</span>
          )}
        </div>
        <ResultTable rows={outputObj.rows as unknown[]} />
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
 * Renders a single UIMessage with its parts (text, tool calls, etc.)
 */
function ChatMessage({ message }: { readonly message: UIMessage }) {
  const isUser = message.role === 'user'

  return (
    <Message from={isUser ? 'user' : 'assistant'}>
      <MessageContent>
        {message.parts.map((part, i) => {
          // Text part - render as markdown for assistant messages
          if (part.type === 'text') {
            return (
              <MessageResponse key={`text-${i}`}>
                {isUser ? (
                  // User messages: plain text
                  part.text
                ) : (
                  // Assistant messages: markdown rendering (wrapped in div)
                  <div className="markdown-content">
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
                          const isInline =
                            !className || className === 'language-'
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
                )}
              </MessageResponse>
            )
          }

          // Tool call part (dynamic tool - from our custom agent)
          if (part.type === 'dynamic-tool') {
            return (
              <ToolCallPart
                key={`tool-${part.toolCallId}`}
                part={part as any}
              />
            )
          }

          // Static typed tool call part (type starts with 'tool-')
          if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
            return (
              <ToolCallPart
                key={`tool-${(part as any).toolCallId}`}
                part={part as any}
              />
            )
          }

          // Step start part
          if (part.type === 'step-start') {
            return (
              <div
                key={`step-${i}`}
                className="border-t border-muted/30 my-2"
              />
            )
          }

          return null
        })}
      </MessageContent>
    </Message>
  )
}

// ============================================================================
// Default suggestions
// ============================================================================

const DEFAULT_SUGGESTIONS = [
  'Show me all databases in this cluster',
  'What are the slowest queries today?',
  'List the top 10 largest tables by size',
  'Show me active merge operations',
  'What is the current CPU and memory usage?',
]

// ============================================================================
// Main Component
// ============================================================================

export function AgentsChatArea({
  hostId,
  isMobile,
  onMenuClick,
}: AgentsChatAreaProps) {
  const { messages, sendMessage, setMessages, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/v1/agent',
      body: { hostId },
    }),
  })

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
  }, [setMessages])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSubmit({ text: suggestion })
    },
    [handleSubmit]
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 sm:px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="h-8 w-8 shrink-0"
            >
              <MenuIcon className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <SparklesIcon className="h-5 w-5 text-purple-500 shrink-0" />
            <h2 className="font-semibold truncate text-sm sm:text-base">
              ClickHouse AI Assistant
            </h2>
            <span className="text-xs text-muted-foreground shrink-0 hidden xs:inline">
              Host {hostId}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              className="h-8 text-xs"
            >
              Stop
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 text-xs"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <Suspense fallback={<ChatSkeleton />}>
        <Conversation>
          <ConversationContent>
            {isEmpty ? (
              <ConversationEmptyState
                title="ClickHouse AI Assistant"
                description="Ask questions about your data using natural language"
                icon={
                  <SparklesIcon className="h-8 w-8 sm:h-12 sm:w-12 text-purple-500" />
                }
              >
                <div className="flex flex-wrap justify-center gap-2 pt-4 px-2 sm:px-4 max-w-2xl">
                  {DEFAULT_SUGGESTIONS.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      suggestion={suggestion}
                      onClick={handleSuggestionClick}
                      className="text-xs sm:text-sm whitespace-normal text-left h-auto py-2"
                    />
                  ))}
                </div>
              </ConversationEmptyState>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && status === 'submitted' && <ChatSkeleton />}
              </>
            )}
          </ConversationContent>
        </Conversation>
      </Suspense>

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
            placeholder="Ask about your ClickHouse data..."
            disabled={isLoading}
          />
          <PromptInputSubmit disabled={isLoading}>
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : null}
          </PromptInputSubmit>
        </PromptInput>
        <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
