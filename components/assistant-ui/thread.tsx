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
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
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
import { type FC, type ReactNode, useCallback, useRef } from 'react'
import { PromptInputTextareaWithMentions } from '@/components/agents/mentions'
import { AgentWelcomeScreen } from '@/components/agents/welcome/agent-welcome-screen'
import { ComposerToolbar } from '@/components/agents/welcome/composer-toolbar'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
      <ThreadPrimitive.Viewport
        scrollToBottomOnInitialize={false}
        className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-14"
      >
        <ThreadWelcome
          firstName={firstName}
          clusterName={clusterName}
          hasClusterIssue={hasClusterIssue}
        />

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-6 grow" />
        </ThreadPrimitive.If>

        <ThreadPrimitive.If empty={false}>
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
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>
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

  const handlePickPrompt = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim()
      if (!trimmed) return
      threadRuntime.append({
        role: 'user',
        content: [{ type: 'text', text: trimmed }],
      })
    },
    [threadRuntime]
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

  return (
    <div className="flex flex-col gap-2">
      <PromptInputTextareaWithMentions
        isLoading={isRunning}
        onResolvedSubmit={(text) => {
          const trimmed = text.trim()
          if (!trimmed) return
          threadRuntime.append({
            role: 'user',
            content: [{ type: 'text', text: trimmed }],
          })
        }}
        onStop={() => threadRuntime.cancelRun()}
      />
      <ComposerToolbar />
    </div>
  )
}

function ThreadComposer() {
  const threadRuntime = useThreadRuntime()
  const isRunning = useThread((thread) => thread.isRunning)

  return (
    <div className="w-full">
      <PromptInputTextareaWithMentions
        isLoading={isRunning}
        onResolvedSubmit={(text) => {
          const trimmed = text.trim()
          if (!trimmed) return
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
  part: PartState,
  _index: number,
  _parts: readonly PartState[]
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
// ChainOfThoughtAccordion — outer collapsible for reasoning + tool groups
// ---------------------------------------------------------------------------

interface ChainOfThoughtAccordionProps {
  isActive: boolean
  children: ReactNode
}

function ChainOfThoughtAccordion({
  isActive,
  children,
}: ChainOfThoughtAccordionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lockScroll = useScrollLock(ref, 220)

  return (
    <Collapsible
      ref={ref}
      defaultOpen
      onOpenChange={lockScroll}
      className="group/cot my-1.5 rounded-lg border border-border/40 bg-muted/10"
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-1.5 px-3 py-2',
          'text-xs font-medium text-muted-foreground',
          'hover:text-foreground transition-colors'
        )}
      >
        <span className="flex-1 text-left">
          {isActive ? 'Thinking…' : 'Thought process'}
        </span>
        {isActive && (
          <span className="mr-1 inline-block size-2 animate-pulse rounded-full bg-primary/60" />
        )}
        <ChevronRightIcon className="size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/cot:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'overflow-hidden',
          'data-[state=closed]:animate-collapsible-up',
          'data-[state=open]:animate-collapsible-down'
        )}
      >
        <div className="border-t border-border/30 flex flex-col gap-0">
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
  const hasNoParts = useMessage(
    (msg) =>
      msg.role === 'assistant' &&
      (msg.content.length === 0 ||
        (msg.content.length === 1 &&
          msg.content[0]?.type === 'text' &&
          (msg.content[0] as { type: 'text'; text: string }).text === ''))
  )

  if (!hasNoParts) return null

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
// Task #3 + #12: Per-message stats footer with timing + relative timestamp
// ---------------------------------------------------------------------------

/** Format seconds into human-readable duration. */
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

/**
 * Per-message stats footer: input tokens · output tokens · duration · model · timestamp.
 * Only renders fields that are actually available — no "—" placeholders.
 */
function MessageStatsFooter() {
  const timing = useMessageTiming()
  const metadata = useMessage((msg) => msg.metadata)
  const createdAt = useMessage((msg) => msg.createdAt)

  // Extract token usage from steps
  const steps = metadata?.steps
  let inputTokens = 0
  let outputTokens = 0
  if (steps && steps.length > 0) {
    for (const step of steps) {
      inputTokens += step.usage?.inputTokens ?? 0
      outputTokens += step.usage?.outputTokens ?? 0
    }
  }

  const hasTokens = inputTokens > 0 || outputTokens > 0
  const hasDuration = timing?.totalStreamTime != null
  const hasTimestamp = createdAt instanceof Date

  // If nothing to show, render nothing
  if (!hasTokens && !hasDuration && !hasTimestamp) return null

  const items: { label: string; value: string }[] = []

  if (hasTokens) {
    items.push({ label: 'in', value: `${inputTokens.toLocaleString()}` })
    items.push({ label: 'out', value: `${outputTokens.toLocaleString()}` })
  }
  if (hasDuration && timing?.totalStreamTime != null) {
    items.push({ label: 'time', value: formatDuration(timing.totalStreamTime) })
  }
  if (timing?.tokensPerSecond != null) {
    items.push({ label: 'tok/s', value: timing.tokensPerSecond.toFixed(1) })
  }

  return (
    <div className="mt-1 flex items-center gap-2.5 text-[10px] text-muted-foreground/60">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-0.5">
          <span className="opacity-70">{item.label}</span>
          <span className="font-mono">{item.value}</span>
        </span>
      ))}
      {hasTimestamp && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default tabular-nums">
              {formatRelative(createdAt)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {formatAbsolute(createdAt)}
          </TooltipContent>
        </Tooltip>
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
          {renderGroupedPart}
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
