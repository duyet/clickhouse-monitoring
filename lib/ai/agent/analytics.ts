/**
 * Agent Analytics Utilities
 *
 * Aggregates token usage and estimates cost across agent steps.
 * Used server-side for logging and client-side for display.
 */

import type { LanguageModelUsage } from 'ai'

// ============================================================================
// Types
// ============================================================================

export interface AgentUsageStats {
  /** Total input (prompt) tokens across all steps */
  totalInputTokens: number
  /** Total output (completion) tokens across all steps */
  totalOutputTokens: number
  /** Total tokens (input + output) */
  totalTokens: number
  /** Tokens read from prompt cache */
  cacheReadTokens: number
  /** Tokens written to prompt cache */
  cacheWriteTokens: number
  /** Reasoning tokens generated */
  reasoningTokens: number
  /** Number of LLM steps completed */
  stepCount: number
  /** Estimated cost in USD, or null if model is unknown */
  estimatedCostUsd: number | null
}

// ============================================================================
// Pricing table
// ============================================================================

/**
 * Per-million-token pricing for known OpenRouter models.
 * Format: [inputPricePerMillion, outputPricePerMillion]
 *
 * Free models (`:free` suffix) are $0.
 * Prices are approximate — update as providers change rates.
 */
export const MODEL_PRICING: Record<string, [number, number]> = {
  // Free tier models
  'stepfun/step-3.5-flash:free': [0, 0],
  'meta-llama/llama-3.3-70b-instruct:free': [0, 0],
  'mistralai/mistral-7b-instruct:free': [0, 0],
  'google/gemma-2-9b-it:free': [0, 0],
  'qwen/qwen-2.5-7b-instruct:free': [0, 0],

  // OpenAI models (via OpenRouter)
  'openai/gpt-4o': [2.5, 10],
  'openai/gpt-4o-mini': [0.15, 0.6],
  'openai/o1': [15, 60],
  'openai/o1-mini': [3, 12],
  'openai/o3-mini': [1.1, 4.4],
  'openai/o4-mini': [1.1, 4.4],

  // Anthropic models (via OpenRouter)
  'anthropic/claude-3-5-sonnet': [3, 15],
  'anthropic/claude-3-5-haiku': [0.8, 4],
  'anthropic/claude-3-7-sonnet': [3, 15],
  'anthropic/claude-opus-4': [15, 75],
  'anthropic/claude-sonnet-4-5': [3, 15],

  // Google models (via OpenRouter)
  'google/gemini-2.0-flash': [0.1, 0.4],
  'google/gemini-2.5-pro': [1.25, 10],
  'google/gemini-2.0-flash-lite': [0.075, 0.3],

  // Meta Llama models (via OpenRouter)
  'meta-llama/llama-3.3-70b-instruct': [0.59, 0.79],
  'meta-llama/llama-3.1-8b-instruct': [0.055, 0.055],

  // Mistral models (via OpenRouter)
  'mistralai/mistral-small': [0.1, 0.3],
  'mistralai/mistral-large': [2, 6],

  // Qwen models (via OpenRouter)
  'qwen/qwen-2.5-72b-instruct': [0.35, 0.4],
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Aggregate token usage across multiple LLM steps.
 *
 * @param steps - Array of LanguageModelUsage from each step
 * @returns Summed usage statistics (model-agnostic, no cost estimate)
 */
export function aggregateUsage(steps: LanguageModelUsage[]): AgentUsageStats {
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalTokens = 0
  let cacheReadTokens = 0
  let cacheWriteTokens = 0
  let reasoningTokens = 0

  for (const usage of steps) {
    totalInputTokens += usage.inputTokens ?? 0
    totalOutputTokens += usage.outputTokens ?? 0
    totalTokens += usage.totalTokens ?? 0
    cacheReadTokens += usage.inputTokenDetails?.cacheReadTokens ?? 0
    cacheWriteTokens += usage.inputTokenDetails?.cacheWriteTokens ?? 0
    reasoningTokens += usage.outputTokenDetails?.reasoningTokens ?? 0
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    cacheReadTokens,
    cacheWriteTokens,
    reasoningTokens,
    stepCount: steps.length,
    estimatedCostUsd: null,
  }
}

/**
 * Estimate cost in USD for a given usage and model.
 *
 * Returns null for unknown models. Returns 0 for free models.
 * Uses cache-read tokens at a 0.1× discount when pricing is available.
 *
 * @param usage - Aggregated usage stats
 * @param model - Model identifier string (e.g. "openai/gpt-4o")
 * @returns Estimated USD cost, or null if model is not in the pricing table
 */
export function estimateCost(
  usage: AgentUsageStats,
  model: string
): number | null {
  // Normalize the model string — strip provider prefix variants
  const normalizedModel = model.trim().toLowerCase()

  const pricing = MODEL_PRICING[normalizedModel]

  // Check for :free suffix pattern not in table
  if (!pricing) {
    if (normalizedModel.endsWith(':free')) return 0
    return null
  }

  const [inputPrice, outputPrice] = pricing

  // Free model
  if (inputPrice === 0 && outputPrice === 0) return 0

  const PER_MILLION = 1_000_000

  // Non-cached input tokens
  const noCacheInput =
    usage.totalInputTokens - usage.cacheReadTokens - usage.cacheWriteTokens
  const inputCost = (Math.max(0, noCacheInput) / PER_MILLION) * inputPrice

  // Cache read at 0.1× rate (common discount)
  const cacheReadCost = (usage.cacheReadTokens / PER_MILLION) * inputPrice * 0.1

  // Cache write at 1.25× rate (common surcharge)
  const cacheWriteCost =
    (usage.cacheWriteTokens / PER_MILLION) * inputPrice * 1.25

  const outputCost = (usage.totalOutputTokens / PER_MILLION) * outputPrice

  return inputCost + cacheReadCost + cacheWriteCost + outputCost
}

/**
 * Aggregate usage across steps and attach cost estimate.
 *
 * Convenience wrapper combining aggregateUsage + estimateCost.
 */
export function aggregateUsageWithCost(
  steps: LanguageModelUsage[],
  model: string
): AgentUsageStats {
  const stats = aggregateUsage(steps)
  return { ...stats, estimatedCostUsd: estimateCost(stats, model) }
}
