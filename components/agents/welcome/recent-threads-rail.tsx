'use client'

/**
 * Recent threads list shown on the AI Agent welcome screen.
 *
 * Wraps assistant-ui's `ThreadListPrimitive.Items` so the entries stay in
 * sync with the persistent thread-list adapter (D1 or localStorage). When
 * there are no saved threads, we render a soft empty state.
 */

import { ArrowRightIcon, SparklesIcon } from 'lucide-react'

import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadList,
  useThreadListItem,
} from '@assistant-ui/react'
import { cn } from '@/lib/utils'

/** Format a Unix-ms timestamp as a short relative string. */
function formatRelativeTime(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function RecentThreadsRail() {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-muted-foreground text-[11px] font-medium tracking-[0.06em] uppercase">
          Recent threads
        </h3>
        <span className="text-muted-foreground text-[11px]">
          <ThreadCountLabel />
        </span>
      </div>

      <div className="divide-border border-border/60 divide-y rounded-lg border">
        <ThreadListPrimitive.Root>
          <ThreadListPrimitive.Items components={{ ThreadListItem }} />
        </ThreadListPrimitive.Root>
        <ThreadEmptyState />
      </div>
    </section>
  )
}

function ThreadCountLabel() {
  const count = useThreadList((state) => state.threadIds.length)
  if (count === 0) return null
  return (
    <span className="font-mono tabular-nums">
      {count} {count === 1 ? 'thread' : 'threads'}
    </span>
  )
}

function ThreadEmptyState() {
  const count = useThreadList((state) => state.threadIds.length)
  if (count > 0) return null
  return (
    <div className="text-muted-foreground px-3 py-8 text-center text-[12px]">
      No conversations yet. Start one above.
    </div>
  )
}

function ThreadListItem() {
  return (
    <ThreadListItemPrimitive.Root
      className={cn(
        'hover:bg-muted/50 active:scale-[0.995] group flex items-center gap-3 transition-[transform,background-color] duration-150',
        'first:rounded-t-lg last:rounded-b-lg'
      )}
    >
      <ThreadListItemPrimitive.Trigger className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
        <div className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md">
          <SparklesIcon className="size-3" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium">
            <ThreadListItemPrimitive.Title fallback="New chat" />
          </div>
          <ThreadItemTime />
        </div>
        <ArrowRightIcon className="text-muted-foreground/60 group-hover:text-foreground size-3 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
      </ThreadListItemPrimitive.Trigger>
    </ThreadListItemPrimitive.Root>
  )
}

/** Reads `custom.createdAt` from the current thread list item context. */
function ThreadItemTime() {
  const custom = useThreadListItem(
    (s: { custom?: Record<string, unknown> }) => s.custom
  )
  const ts = custom?.createdAt
  if (typeof ts !== 'number') return null
  return (
    <div className="text-muted-foreground text-[10.5px] tabular-nums">
      {formatRelativeTime(ts)}
    </div>
  )
}
