/**
 * useAgentSessionStats Hook
 *
 * Extracts and aggregates session statistics from AI SDK messages.
 * Provides message counts and timing information.
 */

import type { UIMessage } from 'ai'

import { useMemo } from 'react'

/**
 * Session statistics aggregated from messages
 */
export interface SessionStats {
  /** Total number of messages */
  totalMessages: number
  /** Number of user messages (requests) */
  requestCount: number
  /** Number of assistant messages (responses) */
  responseCount: number
  /** Number of tool calls */
  toolCallCount: number
  /** Timestamp of the most recent message */
}

/**
 * Empty stats for initialization
 */
const EMPTY_STATS: SessionStats = {
  totalMessages: 0,
  requestCount: 0,
  responseCount: 0,
  toolCallCount: 0,
}

/**
 * Check if a message part represents a tool call.
 * Used by both session-level and per-message stats for consistent counting.
 */
function isToolCallPart(part: unknown): boolean {
  if (typeof part !== 'object' || part === null || !('type' in part))
    return false
  const partType = (part as { type: string }).type
  return (
    partType === 'tool-call' ||
    partType === 'dynamic-tool' ||
    partType.startsWith('tool-')
  )
}

/**
 * Extract stats from AI SDK messages
 */
function extractStats(messages: readonly UIMessage[]): SessionStats {
  let requestCount = 0
  let responseCount = 0
  let toolCallCount = 0

  for (const msg of messages) {
    if (msg.role === 'user') {
      requestCount++
    } else if (msg.role === 'assistant') {
      responseCount++
      if (msg.parts) {
        for (const part of msg.parts) {
          if (isToolCallPart(part)) {
            toolCallCount++
          }
        }
      }
    }
  }

  return {
    totalMessages: messages.length,
    requestCount,
    responseCount,
    toolCallCount,
  }
}

/**
 * Hook for computing agent session statistics
 *
 * Analyzes message history to extract:
 * - Message counts
 * - Tool call counts
 * - Timing information
 *
 * @param messages - AI SDK message history
 * @returns Computed session statistics
 *
 * @example
 * ```tsx
 * const { totalMessages, requestCount, toolCallCount } = useAgentSessionStats(messages)
 *
 * <div>Messages: {totalMessages}</div>
 * <div>Requests: {requestCount}</div>
 * <div>Tool Calls: {toolCallCount}</div>
 * ```
 */
export function useAgentSessionStats(
  messages: readonly UIMessage[] = []
): SessionStats {
  return useMemo(() => {
    if (!messages || messages.length === 0) {
      return EMPTY_STATS
    }

    return extractStats(messages)
  }, [messages])
}

/**
 * Per-message statistics
 */
export interface MessageStats {
  /** Number of tool calls in this message */
  toolCallCount: number
  /** Sum of all tool execution durations in ms (from tool output) */
  totalToolDurationMs: number
}

/**
 * Extract per-message stats from a single UIMessage.
 * Counts tool calls and sums tool durations from output parts.
 */
export function getMessageStats(message: UIMessage): MessageStats {
  let toolCallCount = 0
  let totalToolDurationMs = 0

  for (const part of message.parts) {
    if (!isToolCallPart(part)) continue

    toolCallCount++

    // Extract duration from tool output if available
    const output = (part as { output?: unknown }).output
    if (output && typeof output === 'object' && !Array.isArray(output)) {
      const duration = (output as Record<string, unknown>).duration
      if (typeof duration === 'number' && duration > 0) {
        totalToolDurationMs += duration
      }
    }
  }

  return { toolCallCount, totalToolDurationMs }
}
