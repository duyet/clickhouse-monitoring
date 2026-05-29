'use client'

/**
 * ToolGroup components: collapsible container for adjacent tool calls.
 *
 * When any contained tool is still running, the trigger shows an active
 * spinner to communicate "tools in progress".
 */

import { ChevronRightIcon, WrenchIcon } from 'lucide-react'

import type {
  MessagePartStatus,
  ToolCallMessagePartStatus,
} from '@assistant-ui/react'
import type { PropsWithChildren } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// ToolGroupRoot
// ---------------------------------------------------------------------------

interface ToolGroupRootProps extends PropsWithChildren {
  className?: string
  defaultOpen?: boolean
}

/**
 * Collapsible root container for a set of adjacent tool calls.
 */
export function ToolGroupRoot({
  children,
  className,
  defaultOpen = true,
}: ToolGroupRootProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        'group/toolgroup my-1.5 rounded-lg',
        'border border-border/40 bg-background/40',
        className
      )}
    >
      {children}
    </Collapsible>
  )
}

// ---------------------------------------------------------------------------
// ToolGroupTrigger
// ---------------------------------------------------------------------------

interface ToolGroupTriggerProps {
  /** Total number of tool calls in this group. */
  count?: number
  /**
   * Pass the `status` of the group part from MessagePrimitive.GroupedParts.
   * When `status.type === "running"`, shows an animated spinner.
   */
  status?: MessagePartStatus | ToolCallMessagePartStatus
  className?: string
}

/**
 * Toggle button for the tool group. Shows count + spinner when running.
 */
export function ToolGroupTrigger({
  count,
  status,
  className,
}: ToolGroupTriggerProps) {
  const isRunning = status?.type === 'running'

  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center gap-1.5 px-3 py-2',
        'text-xs font-medium text-muted-foreground',
        'hover:text-foreground transition-colors',
        className
      )}
    >
      <WrenchIcon
        className={cn(
          'size-3.5 shrink-0',
          isRunning && 'animate-pulse text-primary/70'
        )}
      />
      <span className="flex-1 text-left">
        {count != null && count > 0
          ? `${count} tool call${count !== 1 ? 's' : ''}`
          : 'Tool calls'}
      </span>
      {isRunning && (
        <span className="mr-1 inline-block size-2 animate-pulse rounded-full bg-primary/60" />
      )}
      <ChevronRightIcon className="size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/toolgroup:rotate-90" />
    </CollapsibleTrigger>
  )
}

// ---------------------------------------------------------------------------
// ToolGroupContent
// ---------------------------------------------------------------------------

interface ToolGroupContentProps extends PropsWithChildren {
  className?: string
}

/**
 * Animated collapsible body containing the individual tool call renderers.
 */
export function ToolGroupContent({
  children,
  className,
}: ToolGroupContentProps) {
  return (
    <CollapsibleContent
      className={cn(
        'overflow-hidden',
        'data-[state=closed]:animate-collapsible-up',
        'data-[state=open]:animate-collapsible-down'
      )}
    >
      <div
        className={cn(
          'border-t border-border/30 flex flex-col gap-0',
          className
        )}
      >
        {children}
      </div>
    </CollapsibleContent>
  )
}
