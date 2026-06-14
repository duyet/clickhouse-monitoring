'use client'

'use no memo'

/**
 * assistant-ui Thread for the ClickHouse agent.
 *
 * Composes the assistant-ui primitives (Thread / Message / Composer / ActionBar
 * / BranchPicker) and wires in the project's custom pieces, which live in
 * co-located `./-thread/*` modules:
 *  - `composer.tsx`        – welcome + in-thread mention composers
 *  - `chain-of-thought.tsx`– GroupedParts reasoning/tool render pipeline
 *  - `message-stats.tsx`   – per-message stats footer + details dialog
 *  - `format.ts`           – shared duration/date helpers
 *
 * Tasks shipped across this file + its modules:
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
  groupByChainOfThought,
  renderGroupedPart,
} from './-thread/chain-of-thought'
import { ThreadComposer, WelcomeComposer } from './-thread/composer'
import { MessageStatsFooter } from './-thread/message-stats'
import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useMessage,
  useThread,
  useThreadRuntime,
} from '@assistant-ui/react'
import { type ComponentProps, type FC, useCallback } from 'react'
import { AgentWelcomeScreen } from '@/components/agents/welcome/agent-welcome-screen'
import { useAgentAuthGate } from '@/components/assistant-ui/agent-auth-gate'
import { JsonRenderMessage } from '@/components/assistant-ui/json-render-message'
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button'
import { resolveConversationBackend } from '@/lib/conversation-store/adapter/resolve-thread-list-adapter'
import { useAgentSkills } from '@/lib/hooks/use-agent-skills'

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
