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
  DatabaseIcon,
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
} from 'lucide-react'

import type { FC } from 'react'

import { JsonRenderMessage } from './json-render-message'
import { MarkdownText } from './markdown-text'
import { ToolFallback } from './tool-fallback'
import { TooltipIconButton } from './tooltip-icon-button'
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
import { PromptInputTextareaWithMentions } from '@/components/agents/mentions'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const SUGGESTED_PROMPTS: ReadonlyArray<{ label: string; prompt: string }> = [
  {
    label: 'Slow queries',
    prompt: 'Show the slowest queries in the last 24 hours and explain why.',
  },
  {
    label: 'Largest tables',
    prompt: 'Which tables use the most disk space? Suggest what to optimize.',
  },
  {
    label: 'Cluster health',
    prompt: 'Give me an overview of cluster health and any current issues.',
  },
  {
    label: 'Merge activity',
    prompt: 'Are there any long-running or stuck merges right now?',
  },
]

export function Thread() {
  return (
    <ThreadPrimitive.Root
      className="aui-root flex h-full flex-col overflow-hidden bg-background"
      style={{ ['--thread-max-width' as string]: '46rem' }}
    >
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4">
        <ThreadWelcome />

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

        <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col items-center gap-2 bg-background pb-3">
          <ThreadScrollToBottom />
          <Composer />
          <p className="text-muted-foreground px-1 text-[11px] leading-4">
            The agent runs read-only ClickHouse queries. Conversations are saved
            for this browser.
          </p>
        </div>
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

function ThreadWelcome() {
  return (
    <ThreadPrimitive.Empty>
      <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-1 flex-col justify-center px-2 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
            <DatabaseIcon className="size-6" />
          </div>
          <h2 className="text-xl font-semibold">
            Inspect your ClickHouse cluster
          </h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Ask in plain English — the agent inspects system tables, queries,
            merges, storage and replication, then explains what it finds.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTED_PROMPTS.map((item) => (
            <ThreadPrimitive.Suggestion
              key={item.label}
              prompt={item.prompt}
              method="replace"
              autoSend
              asChild
            >
              <button
                type="button"
                className="border-border/70 hover:border-border hover:bg-muted/50 flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors"
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <SparklesIcon className="text-primary size-3.5" />
                  {item.label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {item.prompt}
                </span>
              </button>
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      </div>
    </ThreadPrimitive.Empty>
  )
}

function Composer() {
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
    <MessagePrimitive.Root className="mx-auto w-full max-w-[var(--thread-max-width)] py-3">
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
        className="text-foreground min-h-12 w-full resize-none bg-transparent text-sm outline-none"
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
        Reasoning
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground border-border/60 border-t px-3 py-2 text-xs whitespace-pre-wrap">
        {text}
      </CollapsibleContent>
    </Collapsible>
  )
}

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="mx-auto w-full max-w-[var(--thread-max-width)] py-3">
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
