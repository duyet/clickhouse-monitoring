'use client'

/**
 * Chain-of-Thought rendering pipeline for assistant messages
 * (Tasks #4 / #8 / #11).
 *
 * `groupByChainOfThought` is the stable module-level groupBy passed to
 * `MessagePrimitive.GroupedParts`; `renderGroupedPart` turns each group/leaf
 * node into UI — an outer collapsible accordion wrapping nested reasoning and
 * tool-call sub-groups. Extracted from `thread.tsx` so the parent only wires
 * the pieces together.
 */

import { ChevronRightIcon } from 'lucide-react'

import { formatDuration } from './format'
import {
  type EnrichedPartState,
  type MessagePartStatus,
  type PartState,
  type ToolCallMessagePartStatus,
  useMessage,
  useMessageTiming,
  useScrollLock,
} from '@assistant-ui/react'
import { type ReactNode, useRef } from 'react'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

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
export const groupByChainOfThought = (
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
export function renderGroupedPart({ part, children }: GroupedRenderInfo) {
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
