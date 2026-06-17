'use client'

/**
 * Chain-of-Thought rendering pipeline for assistant messages
 * (Tasks #4 / #8 / #11).
 *
 * `groupByChainOfThought` is the stable module-level groupBy passed to
 * `MessagePrimitive.GroupedParts`; `renderGroupedPart` turns each group/leaf
 * node into UI. Reasoning and tool-call runs are rendered as SEPARATE sibling
 * blocks (tools are NOT nested under reasoning). Adjacent same-type parts
 * coalesce into one local run, so each tool block counts only the tools in
 * THAT run — not the whole message.
 */

import type { ReactNode } from 'react'

import {
  type EnrichedPartState,
  groupPartByType,
  type MessagePartStatus,
  type ToolCallMessagePartStatus,
} from '@assistant-ui/react'
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

// ---------------------------------------------------------------------------
// GroupedParts groupBy — module-level stable reference
// ---------------------------------------------------------------------------

/**
 * Groups adjacent reasoning parts into a `group-reasoning` run and adjacent
 * tool-call parts into a `group-tool` run, as SEPARATE top-level siblings.
 * A text part between two runs breaks the run, so counts stay local. Text
 * parts are left ungrouped (rendered as leaves).
 *
 * Module-level stable reference — required for GroupedParts performance.
 * `groupPartByType` also carries a memo fingerprint for the tree memoization.
 */
export const groupByChainOfThought = groupPartByType({
  reasoning: ['group-reasoning'],
  'tool-call': ['group-tool'],
})

// Type alias for the group key union used in GroupedParts
type ChainOfThoughtKey = 'group-reasoning' | 'group-tool'

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
 * Reasoning and tool runs render as separate sibling collapsibles whose open
 * state follows the run's `running` status; leaf parts delegate to
 * renderLeafPart().
 */
export function renderGroupedPart({ part, children }: GroupedRenderInfo) {
  switch (part.type) {
    case 'group-reasoning': {
      const isRunning = part.status?.type === 'running'
      return (
        <ReasoningRoot isRunning={isRunning}>
          <ReasoningTrigger active={isRunning} />
          <ReasoningContent>{children}</ReasoningContent>
        </ReasoningRoot>
      )
    }
    case 'group-tool': {
      const isRunning = part.status?.type === 'running'
      const count = part.indices.length
      return (
        <ToolGroupRoot isRunning={isRunning}>
          <ToolGroupTrigger count={count} status={part.status} />
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
