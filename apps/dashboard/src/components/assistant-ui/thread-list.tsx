'use client'

/**
 * Conversation history rail — assistant-ui `ThreadList` primitives bound to the
 * persistent thread-list adapter (D1 or localStorage). Replaces the old
 * `conversation-switcher.tsx` dropdown.
 */

import { ArchiveIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { TooltipIconButton } from './tooltip-icon-button'
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadListItem,
} from '@assistant-ui/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils/format-relative-time'

export function ThreadList() {
  return (
    <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1">
      <ThreadListNew />
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  )
}

function ThreadListNew() {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        className="data-active:bg-muted hover:bg-muted mb-1 flex items-center justify-start gap-2 rounded-lg px-2.5 py-2 text-start"
        variant="ghost"
      >
        <PlusIcon className="size-4" />
        New chat
      </Button>
    </ThreadListPrimitive.New>
  )
}

function ThreadListItems() {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />
}

function ThreadListItem() {
  return (
    <ThreadListItemPrimitive.Root
      className={cn(
        'hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring',
        'data-active:bg-muted group flex items-center gap-2 rounded-lg transition-all',
        'focus-visible:outline-none focus-visible:ring-2'
      )}
    >
      <ThreadListItemPrimitive.Trigger className="min-w-0 flex-grow truncate px-3 py-2 text-start">
        <ThreadListItemPrimitive.Title fallback="New Chat" />
        <ThreadItemTime />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemActions />
    </ThreadListItemPrimitive.Root>
  )
}

function ThreadItemTime() {
  const custom = useThreadListItem(
    (s: { custom?: Record<string, unknown> }) => s.custom
  )
  const ts = custom?.createdAt
  if (typeof ts !== 'number') return null
  return (
    <div className="text-muted-foreground truncate text-[10.5px] tabular-nums">
      {formatRelativeTime(ts)}
    </div>
  )
}

function ThreadListItemActions() {
  return (
    <div className="mr-2 flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <ThreadListItemPrimitive.Archive asChild>
        <TooltipIconButton
          className="hover:text-foreground text-muted-foreground size-7 p-0"
          tooltip="Archive thread"
        >
          <ArchiveIcon className="size-4" />
        </TooltipIconButton>
      </ThreadListItemPrimitive.Archive>
      <ThreadListItemPrimitive.Delete asChild>
        <TooltipIconButton
          className="hover:text-destructive text-muted-foreground size-7 p-0"
          tooltip="Delete thread"
        >
          <Trash2Icon className="size-4" />
        </TooltipIconButton>
      </ThreadListItemPrimitive.Delete>
    </div>
  )
}
