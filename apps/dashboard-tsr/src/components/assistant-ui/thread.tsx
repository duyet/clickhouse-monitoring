'use client'

'use no memo'

/**
 * assistant-ui Thread for the ClickHouse agent.
 *
 * Composes the assistant-ui primitives (Thread / Message / Composer / ActionBar
 * / BranchPicker) and wires in the project's custom pieces: Streamdown
 * markdown, the rich tool-result renderer (`ToolFallback`), json-render
 * generative UI, and the `@table` / `/command` mention composer.
 *
 * Tasks shipped in this file:
 *  #1  – Loading indicator right after user submit
 *  #3  – Per-message stats footer (tokens / duration / model / timestamp)
 *  #4  – Chain-of-Thought via MessagePrimitive.GroupedParts
 *  #5  – ErrorPrimitive rendering
 *  #8  – Reasoning ghost/muted styling (via reasoning.tsx)
 *  #11 – ToolGroup component (collapsible adjacent tool calls)
 *  #12 – Message timing (relative timestamp w/ tooltip)
 */

import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  CpuIcon,
  GaugeIcon,
  InfoIcon,
  PencilIcon,
  RefreshCwIcon,
  WrenchIcon,
} from 'lucide-react'

import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  type EnrichedPartState,
  ErrorPrimitive,
  type MessagePartStatus,
  MessagePrimitive,
  type PartState,
  ThreadPrimitive,
  type ToolCallMessagePartStatus,
  useMessage,
  useMessageTiming,
  useScrollLock,
  useThread,
  useThreadRuntime,
} from '@assistant-ui/react'
import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react'
import { PromptInputTextareaWithMentions } from '@/components/agents/mentions'
import {
  type ContextItem,
  formatContextBlock,
} from '@/components/agents/welcome/add-context-dialog'
import { AgentWelcomeScreen } from '@/components/agents/welcome/agent-welcome-screen'
import { ComposerToolbar } from '@/components/agents/welcome/composer-toolbar'
import { useAgentAuthGate } from '@/components/assistant-ui/agent-auth-gate'
import { JsonRenderMessage } from '@/components/assistant-ui/json-render-message'
import { MarkdownText } from '@/components/assistant-ui/markdown-text'
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningTrigger,
} from '@/components/assistant-ui/reasoning'
import { ToolFallback } from '@/components/assistant-ui/tool-fallback'
import {
  ToolGroupContent,
  ToolGroupRoot,
  ToolGroupTrigger,
} from '@/components/assistant-ui/tool-group'
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { extractMessageUsage } from '@/lib/ai/agent/message-metadata'
import { resolveConversationBackend } from '@/lib/conversation-store/adapter/resolve-thread-list-adapter'
import { useAgentSkills } from '@/lib/hooks/use-agent-skills'
import { cn } from '@/lib/utils'

interface ThreadProps {
  /** Display name to weave into the welcome heading. */
  firstName?: string | null
  /** Cluster the agent is wired into (shown in the greeting + footer). */
  clusterName?: string | null
  /** When true, the greeting switches to its alert variant. */
  hasClusterIssue?: boolean
}

export function Thread({
  firstName,
  clusterName,
  hasClusterIssue,
}: ThreadProps = {}) {
  return (
    <ThreadPrimitive.Root
      className="aui-root flex h-full flex-col overflow-hidden bg-background"
      style={{
        // User messages and composer stay narrow for readability.
        // Assistant responses (charts, tables, SQL) use the full container width.
        ['--thread-max-width' as string]: 'min(100%, 56rem)',
        ['--assistant-max-width' as string]: '100%',
        ['--user-max-width' as string]: 'min(100%, 46rem)',
      }}
    >
      {/* Empty (welcome) state lives OUTSIDE the auto-scrolling Viewport.
          assistant-ui's Viewport pins toward the bottom as content grows, so
          the tall welcome screen (composer + suggested questions) scrolled
          itself down on open. A plain overflow container starts at the top. */}
      <ThreadPrimitive.If empty>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-14">
          <ThreadWelcome
            firstName={firstName}
            clusterName={clusterName}
            hasClusterIssue={hasClusterIssue}
          />
        </div>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If empty={false}>
        <ThreadPrimitive.Viewport
          scrollToBottomOnInitialize={false}
          className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-14"
        >
          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              EditComposer,
              AssistantMessage,
            }}
          />

          <div className="min-h-6 grow" />

          <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col items-center gap-2 bg-background pb-3">
            <ThreadScrollToBottom />
            <ThreadComposer />
            <p className="text-muted-foreground px-1 text-[11px] leading-4">
              The agent runs read-only ClickHouse queries. Conversations are
              saved{' '}
              {resolveConversationBackend() === 'd1'
                ? 'to your account'
                : 'in this browser'}
              .
            </p>
          </div>
        </ThreadPrimitive.Viewport>
      </ThreadPrimitive.If>
    </ThreadPrimitive.Root>
  )
}

function ThreadScrollToBottom() {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-10 z-10 size-8 rounded-full p-1 disabled:invisible"
      >
        <ArrowDownIcon className="size-4" />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  )
}

interface ThreadWelcomeProps {
  firstName?: string | null
  clusterName?: string | null
  hasClusterIssue?: boolean
}

function ThreadWelcome({
  firstName,
  clusterName,
  hasClusterIssue,
}: ThreadWelcomeProps) {
  const { activeToolCount } = useAgentSkills()
  const threadRuntime = useThreadRuntime()
  const { ensureAuthed } = useAgentAuthGate()

  const handlePickPrompt = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim()
      if (!trimmed) return
      if (!ensureAuthed()) return
      threadRuntime.append({
        role: 'user',
        content: [{ type: 'text', text: trimmed }],
      })
    },
    [threadRuntime, ensureAuthed]
  )

  return (
    <ThreadPrimitive.Empty>
      <AgentWelcomeScreen
        firstName={firstName}
        clusterName={clusterName}
        hasClusterIssue={hasClusterIssue}
        activeToolCount={activeToolCount}
        composer={<WelcomeComposer />}
        onPickPrompt={handlePickPrompt}
      />
    </ThreadPrimitive.Empty>
  )
}

/**
 * Welcome-screen composer card: mentions textarea + toolbar (model · skills ·
 * tools · add-context). Wraps the same submission wiring as the in-thread
 * composer below.
 */
function WelcomeComposer() {
  const threadRuntime = useThreadRuntime()
  const isRunning = useThread((thread) => thread.isRunning)
  const { ensureAuthed } = useAgentAuthGate()
  const [contextItems, setContextItems] = useState<ContextItem[]>([])

  return (
    <div className="flex flex-col gap-2">
      <PromptInputTextareaWithMentions
        isLoading={isRunning}
        onResolvedSubmit={(text) => {
          const trimmed = text.trim()
          if (!trimmed) return
          if (!ensureAuthed()) return
          const block = formatContextBlock(contextItems)
          const full = block ? `${block}\n\n${trimmed}` : trimmed
          threadRuntime.append({
            role: 'user',
            content: [{ type: 'text', text: full }],
          })
          setContextItems([])
        }}
        onStop={() => threadRuntime.cancelRun()}
      />
      <ComposerToolbar
        contextItems={contextItems}
        onAddContext={(item) => setContextItems((prev) => [...prev, item])}
        onRemoveContext={(id) =>
          setContextItems((prev) => prev.filter((i) => i.id !== id))
        }
      />
    </div>
  )
}

function ThreadComposer() {
  const threadRuntime = useThreadRuntime()
  const isRunning = useThread((thread) => thread.isRunning)
  const { ensureAuthed } = useAgentAuthGate()

  return (
    <div className="w-full">
      <PromptInputTextareaWithMentions
        isLoading={isRunning}
        onResolvedSubmit={(text) => {
          const trimmed = text.trim()
          if (!trimmed) return
          if (!ensureAuthed()) return
          threadRuntime.append({
            role: 'user',
            content: [{ type: 'text', text: trimmed }],
          })
        }}
        onStop={() => threadRuntime.cancelRun()}
      />
    </div>
  )
}

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="mx-auto w-full max-w-[var(--user-max-width)] py-3">
      <div className="flex flex-col items-end gap-1">
        <UserActionBar />
        <div className="bg-muted text-foreground max-w-[80%] break-words rounded-2xl rounded-br-sm px-4 py-2 text-sm">
          <MessagePrimitive.Parts />
        </div>
        <BranchPicker />
      </div>
    </MessagePrimitive.Root>
  )
}

function UserActionBar() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex items-center"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="text-muted-foreground">
          <PencilIcon className="size-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  )
}

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-muted mx-auto my-2 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-2xl p-3">
      <ComposerPrimitive.Input
        className="text-foreground min-h-12 w-full resize-none bg-transparent text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        autoFocus
      />
      <div className="flex items-center justify-end gap-2">
        <ComposerPrimitive.Cancel asChild>
          <button
            type="button"
            className="hover:bg-background rounded-md px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <button
            type="button"
            className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs"
          >
            Send
          </button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  )
}

// ---------------------------------------------------------------------------
// GroupedParts groupBy — module-level stable reference
// ---------------------------------------------------------------------------

/**
 * Groups adjacent reasoning and tool-call parts under a shared
 * "group-chainOfThought" parent, with nested "group-reasoning" and
 * "group-tool" sub-groups. Text parts are left ungrouped (rendered as leaves).
 *
 * Module-level stable reference — required for GroupedParts performance.
 */
const groupByChainOfThought = (
  part: PartState
): readonly ChainOfThoughtKey[] | null => {
  if (part.type === 'reasoning') {
    return ['group-chainOfThought', 'group-chainOfThought-reasoning'] as const
  }
  if (part.type === 'tool-call') {
    return ['group-chainOfThought', 'group-chainOfThought-tool'] as const
  }
  return null
}

// Type alias for the combined group key union used in GroupedParts
type ChainOfThoughtKey =
  | 'group-chainOfThought'
  | 'group-chainOfThought-reasoning'
  | 'group-chainOfThought-tool'

/** Shape of each group/leaf node delivered by MessagePrimitive.GroupedParts */
type GroupedRenderInfo = {
  readonly part:
    | {
        readonly type: ChainOfThoughtKey
        readonly status: MessagePartStatus | ToolCallMessagePartStatus
        readonly indices: readonly number[]
      }
    | EnrichedPartState
  readonly children: ReactNode
}

// ---------------------------------------------------------------------------
// Shared date/time helpers (used by accordion summary + stats footer)
// ---------------------------------------------------------------------------

/** Format milliseconds into a human-readable duration string. */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const mins = Math.floor(ms / 60_000)
  const secs = Math.round((ms % 60_000) / 1000)
  return `${mins}m ${secs}s`
}

/** Format a Date as absolute readable string. */
function formatAbsolute(date: Date): string {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Format a Date as relative (e.g. "2m ago"). */
function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 5) return 'just now'
  if (diffSecs < 60) return `${diffSecs}s ago`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// ---------------------------------------------------------------------------
// ChainOfThoughtAccordion — outer collapsible for reasoning + tool groups
// ---------------------------------------------------------------------------

interface ChainOfThoughtAccordionProps {
  isActive: boolean
  children: ReactNode
}

/**
 * Builds a compact summary string for the collapsed accordion trigger.
 * Shows tool-call count, step count, and wall-clock duration.
 */
function useCotSummary(isActive: boolean): string | null {
  const timing = useMessageTiming()
  const metadata = useMessage((msg) => msg.metadata)
  const toolCount = useMessage((msg) => {
    if (msg.role !== 'assistant') return 0
    return msg.content.filter(
      (p) =>
        (p as { type?: string })?.type === 'tool-call' ||
        (p as { type?: string })?.type?.startsWith('tool-')
    ).length
  })

  if (isActive) return null

  const parts: string[] = []
  if (toolCount > 0) {
    parts.push(`${toolCount} tool${toolCount !== 1 ? 's' : ''}`)
  }
  const stepCount = (metadata?.steps as unknown[] | undefined)?.length ?? 0
  if (stepCount > 0) {
    parts.push(`${stepCount} turn${stepCount !== 1 ? 's' : ''}`)
  }
  if (timing?.totalStreamTime != null && timing.totalStreamTime > 0) {
    parts.push(formatDuration(timing.totalStreamTime))
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

function ChainOfThoughtAccordion({
  isActive,
  children,
}: ChainOfThoughtAccordionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lockScroll = useScrollLock(ref, 220)
  const summary = useCotSummary(isActive)

  return (
    <Collapsible
      ref={ref}
      defaultOpen
      onOpenChange={lockScroll}
      className="group/cot my-1.5"
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-1.5 py-1',
          'text-xs font-medium text-muted-foreground',
          'hover:text-foreground transition-colors'
        )}
      >
        {isActive ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary/60" />
            <span>Thinking…</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span>Thought process</span>
            {summary && (
              <span className="text-muted-foreground/50 font-normal">
                · {summary}
              </span>
            )}
          </span>
        )}
        <ChevronRightIcon className="ml-auto size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/cot:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'overflow-hidden',
          'data-[state=closed]:animate-collapsible-up',
          'data-[state=open]:animate-collapsible-down'
        )}
      >
        {/* Left rail: single 1px border instead of a full rounded card */}
        <div className="border-l-2 border-border/30 ml-1 pl-3 flex flex-col gap-0">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ---------------------------------------------------------------------------
// Leaf part renderers
// ---------------------------------------------------------------------------

/**
 * Renders an enriched leaf part (text, reasoning, tool-call, etc.) inside
 * GroupedParts. For tool-calls we use the full ToolFallback renderer.
 */
function renderLeafPart(part: EnrichedPartState) {
  switch (part.type) {
    case 'text': {
      // Synthetic empty-text loading part: skip (handled by LoadingIndicator)
      if (part.text === '' && part.status?.type === 'running') return null
      return <MarkdownText {...part} />
    }
    case 'reasoning': {
      const isActive = part.status?.type === 'running'
      return <Reasoning text={part.text ?? ''} active={isActive} />
    }
    case 'tool-call': {
      if (part.toolUI) return <>{part.toolUI}</>
      // Spread all ToolCallMessagePart fields + addResult + resume
      return <ToolFallback {...part} />
    }
    default:
      return null
  }
}

/**
 * Renderer function for MessagePrimitive.GroupedParts.
 * Handles group nodes by wrapping children in collapsible containers,
 * and leaf parts by delegating to renderLeafPart().
 */
function renderGroupedPart({ part, children }: GroupedRenderInfo) {
  switch (part.type) {
    case 'group-chainOfThought': {
      // Outer accordion wrapping all reasoning + tool sub-groups
      const isActive = part.status?.type === 'running'
      return (
        <ChainOfThoughtAccordion isActive={isActive}>
          {children}
        </ChainOfThoughtAccordion>
      )
    }
    case 'group-chainOfThought-reasoning': {
      const isActive = part.status?.type === 'running'
      return (
        <ReasoningRoot>
          <ReasoningTrigger active={isActive} />
          <ReasoningContent>{children}</ReasoningContent>
        </ReasoningRoot>
      )
    }
    case 'group-chainOfThought-tool': {
      const toolCount = part.indices.length
      return (
        <ToolGroupRoot>
          <ToolGroupTrigger count={toolCount} status={part.status} />
          <ToolGroupContent>{children}</ToolGroupContent>
        </ToolGroupRoot>
      )
    }
    default: {
      // Leaf part — cast is safe: non-group parts are EnrichedPartState
      return renderLeafPart(part as EnrichedPartState)
    }
  }
}

// ---------------------------------------------------------------------------
// Task #1: "Thinking…" loading placeholder
// ---------------------------------------------------------------------------

/**
 * Shows a subtle "Thinking…" pulse while the thread is running and the
 * current assistant message has no real parts yet.
 */
function LoadingIndicator() {
  const isRunning = useThread((thread) => thread.isRunning)
  const hasError = useMessage(
    (msg) =>
      msg.role === 'assistant' &&
      (msg.status?.type === 'incomplete' ||
        msg.content.some(
          (p) => (p as { type?: string })?.type === 'data-error'
        ))
  )
  const hasNoParts = useMessage(
    (msg) =>
      msg.role === 'assistant' &&
      (msg.content.length === 0 ||
        (msg.content.length === 1 &&
          msg.content[0]?.type === 'text' &&
          (msg.content[0] as { type: 'text'; text: string }).text === ''))
  )

  if (!isRunning || hasError || !hasNoParts) return null

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="inline-flex gap-0.5">
        <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
        <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
      </span>
      <span className="text-xs text-muted-foreground/70">Thinking…</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Task #3 + #12: Per-message stats footer — inline icons row + details dialog
// ---------------------------------------------------------------------------

/**
 * Detailed stats dialog content: full token breakdown, timing, model info,
 * resolved model badge, per-step data (when available), and timestamp.
 */
function MessageStatsDialog({
  timing,
  usage,
  steps,
  createdAt,
  toolCount,
}: {
  timing: ReturnType<typeof useMessageTiming>
  usage: ReturnType<typeof extractMessageUsage>
  steps: { usage?: { inputTokens?: number; outputTokens?: number } }[] | null
  createdAt: Date | undefined
  toolCount: number
}) {
  const displayModel = usage?.resolvedModel ?? usage?.model
  const requestedModel = usage?.model
  const isResolved =
    usage?.resolvedModel != null && usage.resolvedModel !== usage?.model

  return (
    <div className="space-y-4 text-sm">
      {/* Token breakdown */}
      {usage && (
        <section>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Tokens
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Input</span>
            <span className="font-mono tabular-nums text-right">
              {usage.totalInputTokens.toLocaleString()}
            </span>
            <span className="text-muted-foreground">Output</span>
            <span className="font-mono tabular-nums text-right">
              {usage.totalOutputTokens.toLocaleString()}
            </span>
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono tabular-nums text-right font-medium">
              {usage.totalTokens.toLocaleString()}
            </span>
            {usage.cacheReadTokens > 0 && (
              <>
                <span className="text-muted-foreground">Cache read</span>
                <span className="font-mono tabular-nums text-right text-muted-foreground">
                  {usage.cacheReadTokens.toLocaleString()}
                </span>
              </>
            )}
            {usage.cacheWriteTokens > 0 && (
              <>
                <span className="text-muted-foreground">Cache write</span>
                <span className="font-mono tabular-nums text-right text-muted-foreground">
                  {usage.cacheWriteTokens.toLocaleString()}
                </span>
              </>
            )}
            {usage.reasoningTokens > 0 && (
              <>
                <span className="text-muted-foreground">Reasoning</span>
                <span className="font-mono tabular-nums text-right text-muted-foreground">
                  {usage.reasoningTokens.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </section>
      )}

      {/* Per-step breakdown */}
      {steps && steps.length > 1 && (
        <section>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Per step ({steps.length} turns)
          </p>
          <div className="space-y-1">
            {steps.map((step, i) => {
              const inTok = step.usage?.inputTokens ?? 0
              const outTok = step.usage?.outputTokens ?? 0
              if (inTok === 0 && outTok === 0) return null
              return (
                <div
                  key={i}
                  className="grid grid-cols-[auto_1fr_1fr] gap-x-3 text-xs"
                >
                  <span className="text-muted-foreground/60">#{i + 1}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {inTok.toLocaleString()} in
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {outTok.toLocaleString()} out
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Timing + throughput */}
      {(timing?.totalStreamTime != null || timing?.tokensPerSecond != null) && (
        <section>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Timing
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {timing?.totalStreamTime != null && (
              <>
                <span className="text-muted-foreground">Duration</span>
                <span className="font-mono tabular-nums text-right">
                  {formatDuration(timing.totalStreamTime)}
                </span>
              </>
            )}
            {timing?.tokensPerSecond != null && (
              <>
                <span className="text-muted-foreground">Throughput</span>
                <span className="font-mono tabular-nums text-right">
                  {timing.tokensPerSecond.toFixed(1)} tok/s
                </span>
              </>
            )}
            {toolCount > 0 && (
              <>
                <span className="text-muted-foreground">Tool calls</span>
                <span className="font-mono tabular-nums text-right">
                  {toolCount}
                </span>
              </>
            )}
          </div>
        </section>
      )}

      {/* Model info */}
      {(displayModel ?? usage?.provider) && (
        <section>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Model
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {usage?.provider && (
              <>
                <span className="text-muted-foreground">Provider</span>
                <span className="font-mono text-right text-xs">
                  {usage.provider}
                </span>
              </>
            )}
            {requestedModel && (
              <>
                <span className="text-muted-foreground">
                  {isResolved ? 'Requested' : 'Model'}
                </span>
                <span className="font-mono text-right text-xs break-all">
                  {requestedModel}
                </span>
              </>
            )}
            {isResolved && displayModel && (
              <>
                <span className="text-muted-foreground">Resolved</span>
                <span className="font-mono text-right text-xs break-all">
                  {displayModel}
                </span>
              </>
            )}
            {usage?.estimatedCostUsd != null && (
              <>
                <span className="text-muted-foreground">Est. cost</span>
                <span className="font-mono tabular-nums text-right">
                  {usage.estimatedCostUsd === 0
                    ? 'free'
                    : `$${usage.estimatedCostUsd.toFixed(4)}`}
                </span>
              </>
            )}
          </div>
        </section>
      )}

      {/* Timestamp */}
      {createdAt instanceof Date && (
        <section>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Time
          </p>
          <span className="text-sm">{formatAbsolute(createdAt)}</span>
        </section>
      )}
    </div>
  )
}

/**
 * Per-message stats footer — compact inline icon row with a "details" button
 * that opens a Dialog showing the full breakdown.
 * Only renders when there is something meaningful to show.
 */
function MessageStatsFooter() {
  const timing = useMessageTiming()
  const metadata = useMessage((msg) => msg.metadata)
  const createdAt = useMessage((msg) => msg.createdAt)
  // assistant-ui exposes the AI SDK parts array as `message.content`
  const content = useMessage((msg) => msg.content) as readonly unknown[]

  // Extract data-usage part from content (same shape as UIMessage.parts)
  // extractMessageUsage expects { parts: ... } but assistant-ui uses { content: ... }
  const usage = extractMessageUsage({ parts: content } as Parameters<
    typeof extractMessageUsage
  >[0])

  // Fall back to summing step-level usage when data-usage is absent
  const steps = metadata?.steps as
    | { usage?: { inputTokens?: number; outputTokens?: number } }[]
    | undefined
  let inputTokens = usage?.totalInputTokens ?? 0
  let outputTokens = usage?.totalOutputTokens ?? 0
  if (!usage && steps && steps.length > 0) {
    for (const step of steps) {
      inputTokens += step.usage?.inputTokens ?? 0
      outputTokens += step.usage?.outputTokens ?? 0
    }
  }
  const totalTokens = inputTokens + outputTokens

  const toolCount =
    (content as { type?: string }[])?.filter(
      (p) => p?.type === 'tool-call' || (p?.type?.startsWith('tool-') ?? false)
    ).length ?? 0

  const hasTokens = totalTokens > 0
  const hasDuration = timing?.totalStreamTime != null
  const hasTimestamp = createdAt instanceof Date
  const hasModel = (usage?.resolvedModel ?? usage?.model) != null

  if (!hasTokens && !hasDuration && !hasTimestamp) return null

  // The model to show inline — prefer resolvedModel when it differs
  const displayModel = usage?.resolvedModel ?? usage?.model
  const isResolved =
    usage?.resolvedModel != null && usage.resolvedModel !== usage?.model

  return (
    <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground/55">
      {/* Duration */}
      {hasDuration && timing?.totalStreamTime != null && (
        <span className="flex items-center gap-0.5">
          <ClockIcon className="size-2.5 shrink-0" />
          <span className="font-mono tabular-nums">
            {formatDuration(timing.totalStreamTime)}
          </span>
        </span>
      )}

      {/* Throughput */}
      {timing?.tokensPerSecond != null && (
        <span className="flex items-center gap-0.5">
          <GaugeIcon className="size-2.5 shrink-0" />
          <span className="font-mono tabular-nums">
            {timing.tokensPerSecond.toFixed(1)}
          </span>
        </span>
      )}

      {/* Token total */}
      {hasTokens && (
        <span className="flex items-center gap-0.5">
          <CpuIcon className="size-2.5 shrink-0" />
          <span className="font-mono tabular-nums">
            {totalTokens.toLocaleString()}
          </span>
        </span>
      )}

      {/* Tool call count */}
      {toolCount > 0 && (
        <span className="flex items-center gap-0.5">
          <WrenchIcon className="size-2.5 shrink-0" />
          <span className="font-mono tabular-nums">{toolCount}</span>
        </span>
      )}

      {/* Model — show resolvedModel with badge when it differs from requested */}
      {hasModel && displayModel && (
        <span className="flex items-center gap-1 min-w-0">
          <span className="truncate max-w-[14rem]" title={displayModel}>
            {displayModel}
          </span>
          {isResolved && (
            <Badge
              variant="outline"
              className="px-1 py-0 text-[9px] h-3.5 leading-none border-border/40"
            >
              resolved
            </Badge>
          )}
        </span>
      )}

      {/* Timestamp with tooltip */}
      {hasTimestamp && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default tabular-nums">
              {formatRelative(createdAt as Date)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {formatAbsolute(createdAt as Date)}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Details dialog trigger */}
      {(hasTokens || hasDuration) && (
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-0.5 hover:text-foreground transition-colors"
              aria-label="View response details"
            >
              <InfoIcon className="size-2.5 shrink-0" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Response details</DialogTitle>
            </DialogHeader>
            <MessageStatsDialog
              timing={timing}
              usage={usage}
              steps={steps ?? null}
              createdAt={createdAt instanceof Date ? createdAt : undefined}
              toolCount={toolCount}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Task #5: MessageError using ErrorPrimitive
// ---------------------------------------------------------------------------

function MessageError() {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root
        role="alert"
        className="border-destructive/40 bg-destructive/10 text-destructive mt-1 rounded-lg border px-3 py-2 text-sm"
      >
        <ErrorPrimitive.Message className="line-clamp-4" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  )
}

// ---------------------------------------------------------------------------
// AssistantMessage — wires all tasks together
// ---------------------------------------------------------------------------

/**
 * Assistant message body. Renders streaming parts (text · reasoning · tool
 * calls) without an "Agent" avatar header — the message column already aligns
 * left while user messages align right, so the chrome stays minimal.
 */
const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="mx-auto w-full max-w-[var(--assistant-max-width)] py-3">
      <div className="text-foreground flex flex-col gap-1.5">
        {/* Task #1: loading dots while no parts exist yet */}
        <LoadingIndicator />

        {/* Tasks #4, #8, #11: chain-of-thought with reasoning + tool groups */}
        <MessagePrimitive.GroupedParts groupBy={groupByChainOfThought}>
          {
            // The local GroupedRenderInfo is a structural approximation of the
            // library's RenderInfo<ChainOfThoughtKey>; cast to the exact children
            // signature the component expects (same code path as the Next app).
            renderGroupedPart as ComponentProps<
              typeof MessagePrimitive.GroupedParts
            >['children']
          }
        </MessagePrimitive.GroupedParts>

        <JsonRenderMessage />

        {/* Task #5: error display */}
        <MessageError />

        <div className="flex items-center gap-1">
          <BranchPicker />
          <AssistantActionBar />
        </div>

        {/* Tasks #3 + #12: per-message stats + timestamp */}
        <MessageStatsFooter />
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantActionBar() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-muted-foreground flex items-center gap-1"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon className="size-3.5" />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon className="size-3.5" />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Regenerate">
          <RefreshCwIcon className="size-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  )
}

function BranchPicker() {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className="text-muted-foreground inline-flex items-center gap-1 text-xs"
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon className="size-3.5" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-mono tabular-nums">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon className="size-3.5" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  )
}
