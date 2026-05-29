/**
 * useAgentSessionStats Hook
 *
 * Extracts and aggregates session statistics from AI SDK messages.
 * Provides message counts, timing, and token/cost information.
 */

import type { UIMessage } from 'ai'
import type { AgentUsageStats } from '@/lib/ai/agent/analytics'

import { isTextUIPart } from 'ai'
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
  /** Total input tokens (prompt), estimated from text when metadata unavailable */
  totalInputTokens: number
  /** Total output tokens (completion), estimated from text when metadata unavailable */
  totalOutputTokens: number
  /** Total tokens (input + output) */
  totalTokens: number
  /** Estimated cost in USD, or null if model is unknown */
  estimatedCostUsd: number | null
  /** Average response time in ms across assistant messages, or null if unavailable */
  avgResponseTimeMs: number | null
}

/**
 * Empty stats for initialization
 */
const EMPTY_STATS: SessionStats = {
  totalMessages: 0,
  requestCount: 0,
  responseCount: 0,
  toolCallCount: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: null,
  avgResponseTimeMs: null,
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
 * Extract the plain text content from a message's parts array.
 */
function extractTextFromParts(parts: UIMessage['parts']): string {
  if (!parts) return ''
  return parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join(' ')
}

/**
 * Find the most recent usage data part from assistant messages.
 * The server sends a `{ type: 'data', data: { usage: AgentUsageStats } }` part.
 */
function extractUsageFromDataParts(
  messages: readonly UIMessage[]
): AgentUsageStats | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'assistant' || !msg.parts) continue
    for (let j = msg.parts.length - 1; j >= 0; j--) {
      const part = msg.parts[j]
      if (
        typeof part === 'object' &&
        part !== null &&
        'type' in part &&
        (part as { type: string }).type === 'data-usage'
      ) {
        const data = (part as { data?: unknown[] }).data
        if (
          Array.isArray(data) &&
          data.length > 0 &&
          typeof data[0] === 'object' &&
          data[0] !== null &&
          'totalTokens' in (data[0] as Record<string, unknown>)
        ) {
          return data[0] as AgentUsageStats
        }
      }
    }
  }
  return null
}

/**
 * Extract stats from AI SDK messages.
 *
 * Uses real usage data from the server when available (sent as data parts).
 * Falls back to text-length estimation when no usage data is present.
 */
function extractStats(messages: readonly UIMessage[]): SessionStats {
  let requestCount = 0
  let responseCount = 0
  let toolCallCount = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const msg of messages) {
    if (msg.role === 'user') {
      requestCount++
      const textContent = extractTextFromParts(msg.parts)
      totalInputTokens += Math.ceil(textContent.length / 4)
    } else if (msg.role === 'assistant') {
      responseCount++
      const textContent = extractTextFromParts(msg.parts)
      totalOutputTokens += Math.ceil(textContent.length / 4)
      if (msg.parts) {
        for (const part of msg.parts) {
          if (isToolCallPart(part)) {
            toolCallCount++
          }
        }
      }
    }
  }

  // Use real usage data from the server if available
  const serverUsage = extractUsageFromDataParts(messages)
  if (serverUsage) {
    return {
      totalMessages: messages.length,
      requestCount,
      responseCount,
      toolCallCount,
      totalInputTokens: serverUsage.totalInputTokens,
      totalOutputTokens: serverUsage.totalOutputTokens,
      totalTokens: serverUsage.totalTokens,
      estimatedCostUsd: serverUsage.estimatedCostUsd,
      avgResponseTimeMs: null,
    }
  }

  return {
    totalMessages: messages.length,
    requestCount,
    responseCount,
    toolCallCount,
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    estimatedCostUsd: null,
    avgResponseTimeMs: null,
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
