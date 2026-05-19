'use client'

'use no memo'

import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'

import type { Spec } from '@json-render/core'
import type { UIMessage } from 'ai'
import type { AgentError } from '@/lib/ai/agent/errors'

import {
  type DataPart,
  getTextFromParts,
  Renderer,
  useJsonRenderMessage,
} from '@json-render/react'
import { useMemo } from 'react'
import { Streamdown } from 'streamdown'
import { AgentErrorDisplay } from '@/components/agents/agent-error-display'
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
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from '@/components/ai-elements/task'
import { getMessageStats } from '@/lib/hooks/use-agent-session-stats'
import { formatDuration } from '@/lib/utils'

import '../markdown-code.css'

import { MessageDetailsDialog } from './message-details-dialog'
import { type AgentToolPart, ToolCallPart } from './tool-output'
import { parseAgentError } from '@/lib/ai/agent/errors'
import {
  AGENT_JSON_RENDER_MAX_ELEMENT_COUNT,
  AGENT_JSON_RENDER_MAX_SPEC_BYTES,
  AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES,
  AGENT_JSON_RENDER_MAX_SPEC_PARTS,
} from '@/lib/ai/agent/json-render-catalog'
import { AGENT_JSON_RENDER_CATALOG } from '@/lib/ai/agent/json-render-catalog-with-schema'
import { AGENT_JSON_RENDER_REGISTRY } from '@/lib/ai/agent/json-render-registry'
import {
  extractMessageError,
  extractMessageUsage,
} from '@/lib/ai/agent/message-metadata'

const jsonRenderTextEncoder = new TextEncoder()

interface ChatMessageProps {
  readonly message: UIMessage
  readonly isStreaming?: boolean
  readonly responseDurationMs?: number
  readonly error?: Error | null
  readonly followUpError?: AgentError | null
  readonly onRegenerate?: () => void
  readonly branchIndex?: number
  readonly branchCount?: number
  readonly onBranchChange?: (index: number) => void
  readonly onToolResult?: (toolCallId: string, result: string) => void
  readonly onErrorDismiss?: () => void
}

type SafeJsonRenderResult = {
  hasSpec: boolean
  spec: Spec | null
  text: string
  parseError: string | null
}

type SafeByteLengthCache = {
  readonly objectCache: WeakMap<object, number>
  readonly primitiveCache: Map<string, number>
}

function getSafeJsonRenderMessageParts(parts: readonly unknown[]): DataPart[] {
  return parts.filter(
    (part): part is DataPart =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      typeof (part as { type: unknown }).type === 'string'
  )
}

function safeCalculateByteLength(value: unknown): number {
  try {
    return jsonRenderTextEncoder.encode(JSON.stringify(value)).length
  } catch (_error) {
    return Number.POSITIVE_INFINITY
  }
}

function safeCalculateByteLengthWithCache(
  value: unknown,
  cache: SafeByteLengthCache
): number {
  if (typeof value === 'object' && value !== null) {
    const cached = cache.objectCache.get(value)
    if (cached !== undefined) {
      return cached
    }

    const next = safeCalculateByteLength(value)
    cache.objectCache.set(value, next)
    return next
  }

  const key = typeof value === 'string' ? `string:${value}` : String(value)
  const cached = cache.primitiveCache.get(key)
  if (cached !== undefined) {
    return cached
  }

  const next = safeCalculateByteLength(value)
  cache.primitiveCache.set(key, next)
  return next
}

function countSpecElements(spec: Spec | null): number {
  if (!spec || typeof spec !== 'object') return 0
  if (!('elements' in spec) || spec.elements == null) return 0
  if (typeof spec.elements !== 'object' || Array.isArray(spec.elements))
    return 0

  return Object.keys(spec.elements as Record<string, unknown>).length
}

function getDataSpecMetrics(parts: readonly DataPart[]): {
  count: number
  totalBytes: number
  hasOversizePart: boolean
} {
  const safeCache: SafeByteLengthCache = {
    objectCache: new WeakMap(),
    primitiveCache: new Map(),
  }

  let count = 0
  let totalBytes = 0
  let hasOversizePart = false

  for (const part of parts) {
    if (part.type !== 'data-spec') continue
    count += 1

    const partBytes = safeCalculateByteLengthWithCache(part.data, safeCache)
    totalBytes += partBytes

    if (partBytes > AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES) {
      hasOversizePart = true
      return { count, totalBytes, hasOversizePart }
    }
  }

  return { count, totalBytes, hasOversizePart }
}

/**
 * Validate and sanitize parsed json-render inline UI specs.
 */
export function validateAndSanitizeSpecFromParts(
  parts: readonly DataPart[],
  parsed: { spec: Spec | null; text: string; hasSpec: boolean }
): SafeJsonRenderResult {
  const text = parsed.text
  if (!parsed.hasSpec || !parsed.spec) {
    return { hasSpec: false, spec: null, text, parseError: null }
  }

  const specMetrics = getDataSpecMetrics(parts)

  if (specMetrics.hasOversizePart) {
    return {
      hasSpec: false,
      spec: null,
      text,
      parseError: `Inline UI patch data exceeded per-part limit (${AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES} bytes).`,
    }
  }

  if (specMetrics.count > AGENT_JSON_RENDER_MAX_SPEC_PARTS) {
    return {
      hasSpec: false,
      spec: null,
      text,
      parseError: `Too many inline UI patches (${specMetrics.count}).`,
    }
  }

  if (specMetrics.totalBytes > AGENT_JSON_RENDER_MAX_SPEC_BYTES) {
    return {
      hasSpec: false,
      spec: null,
      text,
      parseError: `Inline UI patch data exceeded limit (${specMetrics.totalBytes} bytes).`,
    }
  }

  const compiled = parsed.spec
  const totalSpecBytes = safeCalculateByteLength(compiled)
  const elementCount = countSpecElements(compiled)
  if (totalSpecBytes > AGENT_JSON_RENDER_MAX_SPEC_BYTES) {
    return {
      hasSpec: false,
      spec: null,
      text,
      parseError: `Generated UI spec is too large (${totalSpecBytes} bytes).`,
    }
  }

  if (elementCount > AGENT_JSON_RENDER_MAX_ELEMENT_COUNT) {
    return {
      hasSpec: false,
      spec: null,
      text,
      parseError: `Generated UI has too many elements (${elementCount}).`,
    }
  }

  let validation: { success: boolean; data?: unknown }
  try {
    validation = AGENT_JSON_RENDER_CATALOG.validate(compiled)
  } catch (_error) {
    return {
      hasSpec: false,
      spec: null,
      text,
      parseError:
        'Generated UI spec is invalid. Skipping inline rendering for safety.',
    }
  }

  if (!validation.success) {
    return {
      hasSpec: false,
      spec: null,
      text,
      parseError:
        'Generated UI spec is invalid. Skipping inline rendering for safety.',
    }
  }

  return {
    hasSpec: true,
    spec: (validation.data as Spec | null) ?? compiled,
    text,
    parseError: null,
  }
}

function useSafeJsonRenderMessage(
  parts: readonly unknown[]
): SafeJsonRenderResult {
  const dataParts = useMemo(() => getSafeJsonRenderMessageParts(parts), [parts])
  const parsed = useJsonRenderMessage(dataParts)
  const { hasSpec, spec, text } = parsed

  return useMemo(() => {
    try {
      return validateAndSanitizeSpecFromParts(dataParts, {
        hasSpec,
        spec,
        text,
      })
    } catch (_error) {
      return {
        hasSpec: false,
        spec: null,
        text: getTextFromParts(dataParts),
        parseError: 'Unable to parse inline UI payload.',
      }
    }
  }, [dataParts, hasSpec, spec, text])
}

function renderJsonSpec({
  spec,
  isStreaming,
}: {
  readonly spec: Spec
  readonly isStreaming: boolean
}) {
  return (
    <ErrorBoundary fallbackRender={() => null}>
      <Renderer
        spec={spec}
        registry={AGENT_JSON_RENDER_REGISTRY}
        loading={isStreaming}
      />
    </ErrorBoundary>
  )
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

function formatCompactCost(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value === 0) return '$0'
  if (value < 0.0001) return '<$0.0001'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value)
}

function MetadataPill({
  label,
  value,
  title,
}: {
  readonly label: string
  readonly value: string
  readonly title?: string
}) {
  return (
    <span
      className="inline-flex h-7 max-w-full items-center gap-1 rounded-md bg-muted/45 px-2 text-muted-foreground ring-1 ring-border/45"
      title={title}
    >
      <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
        {label}
      </span>
      <span className="min-w-0 truncate font-mono text-[11px] tabular-nums text-foreground/80">
        {value}
      </span>
    </span>
  )
}

function MessageStatsFooter({
  message,
  responseDurationMs,
  error,
  followUpError,
  onRegenerate,
  branchIndex = 0,
  branchCount = 1,
  onBranchChange,
}: {
  readonly message: UIMessage
  readonly responseDurationMs?: number
  readonly error?: AgentError | null
  readonly followUpError?: AgentError | null
  readonly onRegenerate?: () => void
  readonly branchIndex?: number
  readonly branchCount?: number
  readonly onBranchChange?: (index: number) => void
}) {
  const stats = useMemo(() => getMessageStats(message), [message])
  const usage = useMemo(() => extractMessageUsage(message), [message])

  const metadataItems: Array<{
    label: string
    value: string
    title?: string
  }> = []
  if (responseDurationMs && responseDurationMs > 0) {
    metadataItems.push({
      label: 'Time',
      value: formatDuration(responseDurationMs),
      title: 'Response time',
    })
  }
  if (usage?.totalTokens) {
    metadataItems.push({
      label: 'Tokens',
      value: usage.totalTokens.toLocaleString(),
    })
  }
  const cost = formatCompactCost(usage?.estimatedCostUsd)
  if (cost) {
    metadataItems.push({ label: 'Cost', value: cost })
  }
  if (stats.toolCallCount > 0) {
    metadataItems.push({
      label: 'Tools',
      value: stats.toolCallCount.toLocaleString(),
    })
  }
  if (stats.totalToolDurationMs > 0) {
    metadataItems.push({
      label: 'Tool time',
      value: formatDuration(stats.totalToolDurationMs),
    })
  }

  return (
    <div className="mt-1.5 flex select-none flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
      {metadataItems.length > 0 ? (
        metadataItems.map((item) => (
          <MetadataPill
            key={`${item.label}-${item.value}`}
            label={item.label}
            value={item.value}
            title={item.title}
          />
        ))
      ) : (
        <span className="inline-flex h-7 items-center rounded-md bg-muted/30 px-2 text-muted-foreground/70">
          No runtime metadata
        </span>
      )}
      {branchCount > 1 && onBranchChange && (
        <div className="inline-flex h-7 items-center rounded-md bg-muted/35 text-[11px] text-muted-foreground ring-1 ring-border/55">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-l-md transition-[background-color,color] hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={branchIndex <= 0}
            onClick={() => onBranchChange(Math.max(0, branchIndex - 1))}
            aria-label="Show previous response branch"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-10 px-1 text-center font-mono tabular-nums text-foreground/75">
            {branchIndex + 1}/{branchCount}
          </span>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-r-md transition-[background-color,color] hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={branchIndex >= branchCount - 1}
            onClick={() =>
              onBranchChange(Math.min(branchCount - 1, branchIndex + 1))
            }
            aria-label="Show next response branch"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] text-muted-foreground transition-[transform,background-color,color] hover:bg-muted hover:text-foreground active:scale-[0.96]"
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" />
          Regenerate
        </button>
      )}
      <MessageDetailsDialog
        message={message}
        responseDurationMs={responseDurationMs}
        error={error}
        followUpError={followUpError}
      />
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
      <Streamdown
        mermaid={{
          config: { theme: 'default' },
        }}
      >
        {text}
      </Streamdown>
    </div>
  )
}

export function ChatMessage({
  message,
  isStreaming,
  responseDurationMs,
  error,
  followUpError,
  onRegenerate,
  branchIndex,
  branchCount,
  onBranchChange,
  onToolResult,
  onErrorDismiss,
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const jsonRender = useSafeJsonRenderMessage(message.parts)
  const safeParts = useMemo(
    () => getSafeJsonRenderMessageParts(message.parts),
    [message.parts]
  )
  const classifiedError = useMemo(
    () => (error ? parseAgentError(error) : null),
    [error]
  )
  const messageError = useMemo(() => extractMessageError(message), [message])
  const visibleError = classifiedError ?? messageError
  const displayError = visibleError ?? error
  const hasVisibleMessageContent =
    safeParts.some((part) => {
      if (part.type === 'text') {
        return (
          typeof (part as { text?: unknown }).text === 'string' &&
          ((part as { text?: string }).text ?? '').trim().length > 0
        )
      }
      if (part.type === 'reasoning') {
        return (
          typeof (part as { text?: unknown }).text === 'string' &&
          ((part as { text?: string }).text ?? '').trim().length > 0
        )
      }
      return (
        part.type === 'dynamic-tool' ||
        (typeof part.type === 'string' && part.type.startsWith('tool-'))
      )
    }) ||
    jsonRender.hasSpec ||
    Boolean(jsonRender.parseError)

  return (
    <Message from={isUser ? 'user' : 'assistant'}>
      <MessageContent
        className={isUser ? 'group-[.is-user]:py-2.5' : 'gap-1.5'}
      >
        <div className="group relative">
          {safeParts.map((part, index) => {
            const stableKey = getStablePartKey(message.id, part, index)

            if (part.type === 'text') {
              const textPart = part as { type: 'text'; text?: unknown }
              const text =
                typeof textPart.text === 'string' ? textPart.text : ''
              if (isUser) {
                return <MessageResponse key={stableKey}>{text}</MessageResponse>
              }

              return <MarkdownMessage key={stableKey} text={text} />
            }

            if (part.type === 'reasoning') {
              const reasoningPart = part as {
                type: 'reasoning'
                text?: unknown
              }
              const reasoningText =
                typeof reasoningPart.text === 'string' ? reasoningPart.text : ''
              return (
                <Reasoning key={stableKey} isStreaming={!!isStreaming}>
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
                  isMessageStreaming={!!isStreaming}
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

          {isAssistant && (jsonRender.hasSpec || jsonRender.parseError) && (
            <div className="mt-2">
              {jsonRender.hasSpec && jsonRender.spec ? (
                renderJsonSpec({
                  spec: jsonRender.spec,
                  isStreaming: !!isStreaming,
                })
              ) : (
                <div className="rounded border border-yellow-200/40 bg-yellow-50/40 p-2 text-xs text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-200">
                  {jsonRender.parseError}
                </div>
              )}
            </div>
          )}

          {isAssistant && !isStreaming && displayError && (
            <AgentErrorDisplay
              error={displayError}
              embedded
              onRetry={onRegenerate}
              onDismiss={onErrorDismiss}
            />
          )}

          {isAssistant &&
            !isStreaming &&
            !displayError &&
            !hasVisibleMessageContent && (
              <div className="mt-2 rounded-lg bg-muted/35 px-3 py-2 text-xs leading-5 text-muted-foreground">
                The model returned an empty response. Retry or switch models if
                this keeps happening.
              </div>
            )}
        </div>

        {isAssistant && !isStreaming && (
          <MessageStatsFooter
            message={message}
            responseDurationMs={responseDurationMs}
            error={visibleError}
            followUpError={followUpError}
            onRegenerate={onRegenerate}
            branchIndex={branchIndex}
            branchCount={branchCount}
            onBranchChange={onBranchChange}
          />
        )}
      </MessageContent>
    </Message>
  )
}
