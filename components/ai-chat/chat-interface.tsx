/**
 * AI Chat Interface Component
 *
 * A React component for the natural language to SQL chat interface.
 * Allows users to ask questions in natural language and get SQL query results.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Component Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ChatInterface
 * ├── ChatHeader (title, status, clear button)
 * ├── ChatMessages (scrollable message list)
 * │   ├── UserMessage
 * │   ├── AssistantMessage
 * │   └── SystemMessage (query results, errors)
 * └── ChatInput (textarea, send button)
 *
 * Data Flow:
 * 1. User types message → ChatInput
 * 2. onSubmit → POST /api/v1/agent
 * 3. API returns response + query result
 * 4. Messages update with SQL and results table
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import { Loader2Icon, SendIcon, SparklesIcon, TrashIcon } from 'lucide-react'

import { Suspense, useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

/** Chat message types */
type MessageRole = 'user' | 'assistant' | 'system'

interface ChatMessage {
  readonly id: string
  readonly role: MessageRole
  readonly content: string
  readonly timestamp: number
  readonly metadata?: {
    readonly node?: string
    readonly tables?: readonly string[]
    readonly rowCount?: number
    readonly duration?: number
    readonly [key: string]: unknown
  }
}

/** Agent response from API */
interface AgentResponse {
  readonly content: string
  readonly type: 'text' | 'query_result' | 'error' | 'explanation'
  readonly data?: {
    readonly query?: {
      readonly sql: string
      readonly explanation: string
      readonly tables: readonly string[]
    }
    readonly result?: {
      readonly rows: readonly unknown[]
      readonly rowCount: number
      readonly duration: number
    }
  }
  readonly suggestions?: readonly string[]
}

/** API response type */
interface AgentApiResponse {
  readonly response?: AgentResponse
  readonly messages?: readonly ChatMessage[]
  readonly generatedQuery?: {
    readonly sql: string
    readonly explanation: string
    readonly tables: readonly string[]
  }
  readonly queryResult?: {
    readonly success: boolean
    readonly rows?: readonly unknown[]
    readonly rowCount?: number
    readonly duration?: number
    readonly error?: string
  }
  readonly intent?: {
    readonly type: string
    readonly confidence: number
  }
}

interface ChatInterfaceProps {
  readonly hostId?: number
  readonly className?: string
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 space-y-2 max-w-[80%]">
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

function Message({ message }: { readonly message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div
      className={cn(
        'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isSystem
              ? 'bg-muted text-muted-foreground'
              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
        )}
      >
        {isUser ? (
          <span className="text-sm font-medium">U</span>
        ) : isSystem ? (
          <SparklesIcon className="h-4 w-4" />
        ) : (
          <span className="text-sm font-medium">AI</span>
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'rounded-lg px-4 py-2 max-w-[80%]',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isSystem
              ? 'bg-muted text-muted-foreground'
              : 'bg-accent'
        )}
      >
        {/* Timestamp */}
        <div className="text-xs opacity-70 mb-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>

        {/* Content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Metadata badges */}
        {message.metadata?.tables && message.metadata.tables.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.metadata.tables.map((table) => (
              <span
                key={table}
                className="text-xs px-2 py-0.5 rounded-md bg-background/50"
              >
                {table}
              </span>
            ))}
          </div>
        )}

        {/* Query result metadata */}
        {message.metadata?.rowCount !== undefined && (
          <div className="mt-2 text-xs opacity-80">
            {message.metadata.rowCount} rows
            {message.metadata.duration && (
              <span> · {message.metadata.duration}ms</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultTable({ rows }: { readonly rows: readonly unknown[] }) {
  const displayRows = rows.slice(0, 100) // Limit to 100 rows for display
  const columns =
    displayRows.length > 0
      ? Object.keys(displayRows[0] as Record<string, unknown>)
      : []

  if (columns.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No columns to display
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 max-w-xs truncate">
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

export function ChatInterface({
  hostId: propHostId,
  className,
}: ChatInterfaceProps) {
  const resolvedHostId = useHostId()
  const hostId = propHostId ?? resolvedHostId

  const [messages, setMessages] = useState<readonly ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I can help you query ClickHouse using natural language. Try asking:\n\n• "Show me the 10 slowest queries from today"\n• "What are the largest tables?"\n• "Show me active merge operations"',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [_isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          hostId,
          history: messages,
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: { readonly message?: string }
        }
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      const data = (await response.json()) as AgentApiResponse

      startTransition(() => {
        const newMessages: ChatMessage[] = []

        // Add main response
        if (data.response?.content) {
          newMessages.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.response.content,
            timestamp: Date.now(),
            metadata: {
              node: 'response',
              type: data.response.type,
            },
          })
        }

        // Add SQL query if generated
        if (data.generatedQuery?.sql) {
          newMessages.push({
            id: crypto.randomUUID(),
            role: 'system',
            content: `**Generated SQL:**\n\`\`\`sql\n${data.generatedQuery.sql}\n\`\`\`\n\n${data.generatedQuery.explanation}`,
            timestamp: Date.now(),
            metadata: {
              node: 'textToSql',
              tables: data.generatedQuery.tables,
            },
          })
        }

        // Add query results if available
        if (data.queryResult?.success && data.queryResult.rows) {
          newMessages.push({
            id: crypto.randomUUID(),
            role: 'system',
            content: `**Query Results:**\n\n${data.queryResult.rowCount} rows returned in ${data.queryResult.duration}ms`,
            timestamp: Date.now(),
            metadata: {
              node: 'executeQuery',
              rowCount: data.queryResult.rowCount,
              duration: data.queryResult.duration,
              rows: data.queryResult.rows,
            },
          })
        }

        // Add error if query failed
        if (data.queryResult?.error) {
          newMessages.push({
            id: crypto.randomUUID(),
            role: 'system',
            content: `**Query Error:**\n\n${data.queryResult.error}`,
            timestamp: Date.now(),
            metadata: { node: 'error' },
          })
        }

        // Add suggestions if available
        if (
          data.response?.suggestions &&
          data.response.suggestions.length > 0
        ) {
          newMessages.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `**Suggested follow-ups:**\n\n${data.response.suggestions.map((s) => `• ${s}`).join('\n')}`,
            timestamp: Date.now(),
          })
        }

        setMessages((prev) => [...prev, ...newMessages])
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `**Error:** ${errorMessage}`,
          timestamp: Date.now(),
          metadata: { node: 'error' },
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Conversation cleared. How can I help you query ClickHouse?',
        timestamp: Date.now(),
      },
    ])
  }

  const _handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card
      className={cn(
        'flex flex-col h-[calc(100vh-8rem)] overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold">ClickHouse AI Assistant</h2>
          <span className="text-xs text-muted-foreground">Host {hostId}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 text-xs"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {/* Show query results table for system messages with rows */}
        {messages
          .filter(
            (
              m
            ): m is ChatMessage & {
              readonly metadata: { readonly rows: readonly unknown[] }
            } =>
              m.role === 'system' &&
              m.metadata?.rows !== undefined &&
              Array.isArray(m.metadata.rows)
          )
          .slice(-1) // Show only the latest result
          .map((message) => (
            <div key={`result-${message.id}`} className="mt-2">
              <ResultTable rows={message.metadata.rows} />
            </div>
          ))}

        {isLoading && <ChatSkeleton />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Ask a question about your ClickHouse data..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  )
}

export function ChatInterfaceWithSuspense(props: ChatInterfaceProps) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatInterface {...props} />
    </Suspense>
  )
}
