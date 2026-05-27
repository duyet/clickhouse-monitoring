'use client'

'use no memo'

/**
 * assistant-ui Thread for the ClickHouse agent.
 *
 * Composes the assistant-ui primitives (Thread / Message / Composer / ActionBar
 * / BranchPicker) and wires in the project's custom pieces: Streamdown
 * markdown, the rich tool-result renderer (`ToolFallback`), json-render
 * generative UI, and the `@table` / `/command` mention composer.
 */

import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
} from 'lucide-react'

import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  type ReasoningMessagePartComponent,
  ThreadPrimitive,
  useThread,
  useThreadRuntime,
} from '@assistant-ui/react'
import { type FC, useCallback } from 'react'
import { PromptInputTextareaWithMentions } from '@/components/agents/mentions'
import { AgentWelcomeScreen } from '@/components/agents/welcome/agent-welcome-screen'
import { ComposerToolbar } from '@/components/agents/welcome/composer-toolbar'
import { JsonRenderMessage } from '@/components/assistant-ui/json-render-message'
import { MarkdownText } from '@/components/assistant-ui/markdown-text'
import { ToolFallback } from '@/components/assistant-ui/tool-fallback'
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-14">
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

const ReasoningPart: ReasoningMessagePartComponent = ({ text }) => {
  if (!text?.trim()) return null
  return (
    <Collapsible className="border-border/60 bg-muted/30 my-2 rounded-lg border">
      <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 px-3 py-2 text-xs font-medium">
        <SparklesIcon className="size-3.5" />
        <span>Thought process</span>
        <ChevronRightIcon className="ml-auto size-3 transition-transform group-data-[state=open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground border-border/60 border-t px-3 py-2 text-xs whitespace-pre-wrap">
        {text}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Assistant message body. Renders streaming parts (text · reasoning · tool
 * calls) without an "Agent" avatar header — the message column already aligns
 * left while user messages align right, so the chrome stays minimal.
 */
const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="mx-auto w-full max-w-[var(--assistant-max-width)] py-3">
      <div className="text-foreground flex flex-col gap-1.5">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            Reasoning: ReasoningPart,
            tools: { Fallback: ToolFallback },
          }}
        />
        <JsonRenderMessage />
        <MessageError />
        <div className="flex items-center gap-1">
          <BranchPicker />
          <AssistantActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}

function MessageError() {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="border-destructive/40 bg-destructive/10 text-destructive mt-1 rounded-lg border px-3 py-2 text-sm">
        <ErrorPrimitive.Message className="line-clamp-4" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
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
