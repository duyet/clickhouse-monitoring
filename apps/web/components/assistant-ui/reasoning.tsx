'use client'

/**
 * Reasoning components for displaying chain-of-thought / thinking output.
 *
 * Ghost / muted styling intentionally signals "background processing" —
 * the content feels secondary to the final assistant answer.
 */

import { ChevronRightIcon, SparklesIcon } from 'lucide-react'

import { useScrollLock } from '@assistant-ui/react'
import { type PropsWithChildren, useRef } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// ReasoningRoot
// ---------------------------------------------------------------------------

interface ReasoningRootProps extends PropsWithChildren {
  className?: string
  defaultOpen?: boolean
}

/**
 * Collapsible container for reasoning / chain-of-thought content.
 * Uses ghost/muted styling so it reads as background-layer content.
 */
export function ReasoningRoot({
  children,
  className,
  defaultOpen = false,
}: ReasoningRootProps) {
  const collapsibleRef = useRef<HTMLDivElement>(null)
  const lockScroll = useScrollLock(collapsibleRef, 220)

  return (
    <Collapsible
      ref={collapsibleRef}
      defaultOpen={defaultOpen}
      onOpenChange={lockScroll}
      className={cn(
        'group/reasoning my-1.5 rounded-lg',
        'border border-border/40 bg-muted/20',
        className
      )}
    >
      {children}
    </Collapsible>
  )
}

// ---------------------------------------------------------------------------
// ReasoningTrigger
// ---------------------------------------------------------------------------

interface ReasoningTriggerProps extends PropsWithChildren {
  /** When true, shows a shimmer indicating active streaming. */
  active?: boolean
  className?: string
}

/**
 * Toggle button for the reasoning collapsible.
 * Renders a subtle Sparkles icon + label; chevron rotates when open.
 */
export function ReasoningTrigger({
  children,
  active,
  className,
}: ReasoningTriggerProps) {
  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center gap-1.5 px-3 py-2',
        'text-xs font-medium text-muted-foreground',
        'hover:text-foreground transition-colors',
        className
      )}
    >
      <SparklesIcon
        className={cn(
          'size-3.5 shrink-0',
          active && 'animate-pulse text-primary/70'
        )}
      />
      <span className="flex-1 text-left">{children ?? 'Thought process'}</span>
      <ChevronRightIcon className="size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/reasoning:rotate-90" />
    </CollapsibleTrigger>
  )
}

// ---------------------------------------------------------------------------
// ReasoningContent
// ---------------------------------------------------------------------------

interface ReasoningContentProps extends PropsWithChildren {
  className?: string
}

/**
 * Animated collapsible body for reasoning text.
 */
export function ReasoningContent({
  children,
  className,
}: ReasoningContentProps) {
  return (
    <CollapsibleContent
      className={cn(
        'overflow-hidden',
        'data-[state=closed]:animate-collapsible-up',
        'data-[state=open]:animate-collapsible-down'
      )}
    >
      <div className={cn('border-t border-border/30 px-3 py-2', className)}>
        {children}
      </div>
    </CollapsibleContent>
  )
}

// ---------------------------------------------------------------------------
// ReasoningText
// ---------------------------------------------------------------------------

interface ReasoningTextProps {
  text: string
  className?: string
}

/**
 * Pre-formatted reasoning text with muted / italic ghost styling.
 */
export function ReasoningText({ text, className }: ReasoningTextProps) {
  if (!text?.trim()) return null
  return (
    <p
      className={cn(
        'whitespace-pre-wrap text-xs italic text-muted-foreground/80 leading-relaxed',
        className
      )}
    >
      {text}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Convenience: Reasoning (all-in-one)
// ---------------------------------------------------------------------------

interface ReasoningProps {
  text: string
  active?: boolean
  className?: string
}

/**
 * Convenience wrapper that composes ReasoningRoot + Trigger + Content + Text.
 * Use the sub-components directly when you need more control.
 */
export function Reasoning({ text, active, className }: ReasoningProps) {
  if (!text?.trim()) return null
  return (
    <ReasoningRoot className={className}>
      <ReasoningTrigger active={active} />
      <ReasoningContent>
        <ReasoningText text={text} />
      </ReasoningContent>
    </ReasoningRoot>
  )
}
