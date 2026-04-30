'use client'

'use no memo'

import { RefreshCwIcon } from 'lucide-react'

import type { UIMessage } from 'ai'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
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
import { getMessageStats } from '@/lib/hooks/use-agent-session-stats'
import { cn, formatDuration } from '@/lib/utils'

import '../markdown-code.css'

import { type AgentToolPart, ToolCallPart } from './tool-output'

interface ChatMessageProps {
  readonly message: UIMessage
  readonly allMessages: readonly UIMessage[]
  readonly isLastUserMessage?: boolean
  readonly isStreaming?: boolean
  readonly responseDurationMs?: number
  readonly onRegenerate?: () => void
  readonly onSuggestionClick?: (suggestion: string) => void
  readonly onToolResult?: (toolCallId: string, result: string) => void
}

export function hasMeaningfulContent(message: UIMessage): boolean {
  if (message.role !== 'assistant') return false

  const textParts = message.parts.filter(
    (part): part is { type: 'text'; text: string } =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      part.type === 'text'
  )

  return textParts.some((part) => {
    const cleaned = part.text
      .replace(/```[\w]*\n?[\s\S]*?```/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim()

    return cleaned.length > 10
  })
}

export function TypingIndicator() {
  return (
    <Message from="assistant">
      <MessageContent>
        <div className="flex items-center gap-1 py-2">
          <span className="flex gap-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60" />
          </span>
        </div>
      </MessageContent>
    </Message>
  )
}

export function StreamingTypingIndicator({
  messages,
}: {
  readonly messages: readonly UIMessage[]
}) {
  const lastMessage = messages[messages.length - 1]
  const shouldShowTyping =
    !lastMessage ||
    lastMessage.role === 'user' ||
    (lastMessage.role === 'assistant' && !hasMeaningfulContent(lastMessage))

  if (!shouldShowTyping) return null

  return <TypingIndicator />
}

function getStablePartKey(
  messageId: string,
  part: unknown,
  index: number
): string {
  const p = part as Record<string, unknown>

  if (
    p.type === 'dynamic-tool' ||
    (typeof p.type === 'string' && p.type.startsWith('tool-'))
  ) {
    return `msg-${messageId}-tool-${p.toolCallId as string}`
  }

  if (p.type === 'text') return `msg-${messageId}-text-${index}`
  if (p.type === 'step-start') return `msg-${messageId}-step-${index}`
  if (p.type === 'reasoning') return `msg-${messageId}-reasoning-${index}`

  return `msg-${messageId}-part-${index}`
}

function MessageStatsFooter({
  message,
  responseDurationMs,
}: {
  readonly message: UIMessage
  readonly responseDurationMs?: number
}) {
  const stats = useMemo(() => getMessageStats(message), [message])

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
    <div className="mt-2 select-none pt-1.5 text-[11px] text-muted-foreground/60">
      {parts.join(' · ')}
    </div>
  )
}

type MessageSection =
  | { readonly type: 'markdown'; readonly text: string }
  | { readonly type: 'tasks'; readonly items: readonly string[] }

function getTaskItem(line: string): string | null {
  const match = /^[\s]*-\s+\[[ xX]\]\s+(.+)$/.exec(line)
  return match ? match[1].trim() : null
}

function extractMessageSections(text: string): MessageSection[] | null {
  const lines = text.split('\n')
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0)
  const taskCount = nonEmptyLines.filter((line) => getTaskItem(line)).length
  if (taskCount < 3 || taskCount < nonEmptyLines.length * 0.5) return null

  const sections: MessageSection[] = []
  let markdownLines: string[] = []
  let taskItems: string[] = []

  const flushMarkdown = () => {
    const markdown = markdownLines.join('\n').trim()
    if (markdown) sections.push({ type: 'markdown', text: markdown })
    markdownLines = []
  }

  const flushTasks = () => {
    if (taskItems.length > 0) {
      sections.push({ type: 'tasks', items: taskItems })
    }
    taskItems = []
  }

  for (const line of lines) {
    const taskItem = getTaskItem(line)
    if (taskItem) {
      flushMarkdown()
      taskItems.push(taskItem)
    } else {
      flushTasks()
      markdownLines.push(line)
    }
  }

  flushTasks()
  flushMarkdown()

  return sections
}

function generateFollowUpSuggestions(message: UIMessage): string[] {
  const suggestions: string[] = []
  const toolNames: string[] = []

  for (const part of message.parts) {
    if (typeof part !== 'object' || part === null || !('type' in part)) continue

    const partType = (part as { type: string }).type
    if (partType === 'dynamic-tool') {
      const toolName = (part as { toolName?: string }).toolName
      if (toolName) toolNames.push(toolName)
    } else if (typeof partType === 'string' && partType.startsWith('tool-')) {
      toolNames.push(partType.replace(/^tool-/, ''))
    }
  }

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
  if (suggestions.length === 0) {
    suggestions.push('Tell me more about this')
    suggestions.push('What are the key insights?')
  }

  return suggestions.slice(0, 4)
}

function TaskSection({ items }: { readonly items: readonly string[] }) {
  return (
    <div className="my-2">
      <Task>
        <TaskTrigger title="Tasks" />
        <TaskContent>
          {items.map((item, index) => (
            <TaskItem key={index}>{item}</TaskItem>
          ))}
        </TaskContent>
      </Task>
    </div>
  )
}

function MarkdownMessage({ text }: { readonly text: string }) {
  const sections = extractMessageSections(text)

  if (sections) {
    return (
      <>
        {sections.map((section, index) =>
          section.type === 'tasks' ? (
            <TaskSection key={index} items={section.items} />
          ) : (
            <MarkdownContent key={index} text={section.text} />
          )
        )}
      </>
    )
  }

  return <MarkdownContent text={text} />
}

function MarkdownContent({ text }: { readonly text: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
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
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-md bg-muted p-3">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const isInline = !className || className === 'language-'
            return isInline ? (
              <code className="rounded bg-muted px-1 py-0.5 text-sm">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

export function ChatMessage({
  message,
  allMessages: _allMessages,
  isLastUserMessage,
  isStreaming,
  responseDurationMs,
  onRegenerate,
  onSuggestionClick,
  onToolResult,
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const followUpSuggestions = useMemo(() => {
    if (!isAssistant) return []
    return generateFollowUpSuggestions(message)
  }, [message, isAssistant])

  return (
    <Message from={isUser ? 'user' : 'assistant'}>
      <MessageContent>
        <div
          className={cn(
            'group relative',
            isLastUserMessage && isUser && onRegenerate && 'pr-8'
          )}
        >
          {message.parts.map((part, index) => {
            const stableKey = getStablePartKey(message.id, part, index)

            if (part.type === 'text') {
              if (isUser) {
                return (
                  <MessageResponse key={stableKey}>{part.text}</MessageResponse>
                )
              }

              return <MarkdownMessage key={stableKey} text={part.text} />
            }

            if (part.type === 'reasoning') {
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

            if (
              part.type === 'dynamic-tool' ||
              (typeof part.type === 'string' && part.type.startsWith('tool-'))
            ) {
              return (
                <ToolCallPart
                  key={stableKey}
                  part={part as AgentToolPart}
                  onToolResult={onToolResult}
                />
              )
            }

            if (part.type === 'step-start') {
              return (
                <div
                  key={stableKey}
                  className="my-2 border-t border-muted/30"
                />
              )
            }

            return null
          })}

          {isLastUserMessage && isUser && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="absolute right-0 top-0 rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
              title="Regenerate response"
            >
              <RefreshCwIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {isAssistant && !isStreaming && (
          <MessageStatsFooter
            message={message}
            responseDurationMs={responseDurationMs}
          />
        )}

        {isAssistant && followUpSuggestions.length > 0 && (
          <div className="mt-3 border-t border-muted/30 pt-3">
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
