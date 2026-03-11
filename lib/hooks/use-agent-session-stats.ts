/**
 * useAgentSessionStats Hook
 *
 * Extracts and aggregates session statistics from agent messages.
 * Provides model info, iteration counts, duration, and token estimates.
 */

import type { AgentMessage } from '@/lib/agents/state'

import { useMemo } from 'react'

/**
 * Session statistics aggregated from agent messages
 */
export interface SessionStats {
  /** Model used for the most recent request */
  model: string | undefined
  /** Total number of iterations across all requests */
  totalIterations: number
  /** Total duration across all requests (ms) */
  totalDuration: number
  /** Number of user messages (requests) */
  requestCount: number
  /** Average iterations per request */
  avgIterations: number
  /** Average duration per request (ms) */
  avgDuration: number
  /** Timestamp of the most recent request */
  lastRequestAt: number | undefined
}

/**
 * Empty stats for initialization
 */
const EMPTY_STATS: SessionStats = {
  model: undefined,
  totalIterations: 0,
  totalDuration: 0,
  requestCount: 0,
  avgIterations: 0,
  avgDuration: 0,
  lastRequestAt: undefined,
}

/**
 * Extract stats from agent messages
 */
function extractStats(messages: readonly AgentMessage[]): SessionStats {
  let totalIterations = 0
  let totalDuration = 0
  let requestCount = 0
  let lastModel: string | undefined
  let lastRequestAt: number | undefined

  for (const msg of messages) {
    // Count user messages as requests
    if (msg.role === 'assistant' && msg.metadata) {
      const { iterations, duration, model } = msg.metadata

      if (typeof iterations === 'number') {
        totalIterations += iterations
      }
      if (typeof duration === 'number') {
        totalDuration += duration
      }
      if (typeof model === 'string') {
        lastModel = model
      }
      requestCount++
    }

    // Track most recent message timestamp
    if (!lastRequestAt || msg.timestamp > lastRequestAt) {
      lastRequestAt = msg.timestamp
    }
  }

  return {
    model: lastModel,
    totalIterations,
    totalDuration,
    requestCount,
    avgIterations: requestCount > 0 ? totalIterations / requestCount : 0,
    avgDuration: requestCount > 0 ? totalDuration / requestCount : 0,
    lastRequestAt,
  }
}

/**
 * Hook for computing agent session statistics
 *
 * Analyzes message history to extract:
 * - Model used
 * - Iteration counts
 * - Duration metrics
 * - Request counts
 *
 * @param messages - Agent message history
 * @returns Computed session statistics
 *
 * @example
 * ```tsx
 * const { model, totalIterations, avgDuration, requestCount } = useAgentSessionStats(messages)
 *
 * <div>Model: {model}</div>
 * <div>Iterations: {totalIterations}</div>
 * <div>Avg Duration: {avgDuration}ms</div>
 * ```
 */
export function useAgentSessionStats(
  messages: readonly AgentMessage[] = []
): SessionStats {
  return useMemo(() => {
    if (!messages || messages.length === 0) {
      return EMPTY_STATS
    }

    return extractStats(messages)
  }, [messages])
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

/**
 * Format model name for display
 */
export function formatModelName(modelId: string): string {
  // Extract model name from ID
  // e.g., "meta-llama/llama-3.1-8b:free" → "Llama 3.1 8B"
  const parts = modelId.split('/')
  if (parts.length < 2) return modelId

  const name = parts[parts.length - 1].replace(/:free$/, '').replace(/-/g, ' ')

  return name
}
