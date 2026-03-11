/**
 * Model Capability Registry
 *
 * This module provides a catalog of OpenRouter models with their capabilities
 * for intelligent model selection based on requirements like streaming,
 * tool calling, context length, and cost.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Model Capabilities
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Each model is cataloged with:
 * - id: Model identifier for OpenRouter API
 * - streaming: Supports SSE streaming responses
 * - tools: Supports function calling/tool use
 * - contextLength: Maximum context window in tokens
 * - fast: Optimized for low latency (optional)
 * - fallback: Designated as fallback option (optional)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Model selection capability flags
 */
export interface SelectionModelCapabilities {
  /** Model identifier */
  id: string
  /** Supports streaming responses */
  streaming: boolean
  /** Supports function calling/tools */
  tools: boolean
  /** Maximum context window in tokens */
  contextLength: number
  /** Optimized for speed/low latency */
  fast?: boolean
  /** Is this a fallback model when no better match exists */
  fallback?: boolean
}

/**
 * Model selection criteria
 */
export interface ModelSelectionCriteria {
  /** Require streaming support */
  streaming?: boolean
  /** Require tool calling support */
  tools?: boolean
  /** Only free models */
  free?: boolean
  /** Prefer fast models */
  fast?: boolean
  /** Minimum context length in tokens */
  minContext?: number
  /** Exclude fallback models from selection */
  excludeFallback?: boolean
}

/**
 * Model registry with capabilities
 *
 * Free tier models available on OpenRouter:
 * - llama-3.1-8b: Latest Llama with 128K context
 * - gemma-3-4b: Fast model for simple tasks
 * - gemma-2-9b: Balanced performance
 * - llama-3-8b: Reliable workhorse
 * - openrouter/free: Auto-routing fallback
 */
export const MODEL_REGISTRY: Record<string, SelectionModelCapabilities> = {
  'meta-llama/llama-3.1-8b:free': {
    id: 'meta-llama/llama-3.1-8b:free',
    streaming: true,
    tools: true,
    contextLength: 128000,
  },
  'google/gemma-3-4b-it:free': {
    id: 'google/gemma-3-4b-it:free',
    streaming: true,
    tools: true,
    contextLength: 32000,
    fast: true,
  },
  'google/gemma-2-9b:free': {
    id: 'google/gemma-2-9b:free',
    streaming: true,
    tools: true,
    contextLength: 32000,
  },
  'meta-llama/llama-3-8b:free': {
    id: 'meta-llama/llama-3-8b:free',
    streaming: true,
    tools: true,
    contextLength: 32000,
  },
  'openrouter/free': {
    id: 'openrouter/free',
    streaming: true,
    tools: true,
    contextLength: 32000,
    fallback: true,
  },
}

/**
 * Priority score for model selection
 *
 * Higher score = better match for selection criteria.
 * Priority factors:
 * - Fast models get +10
 * - Higher context gets +1 per 64K tokens
 */
function getModelScore(
  model: SelectionModelCapabilities,
  criteria: ModelSelectionCriteria
): number {
  let score = 0

  // Prefer fast models for latency-sensitive tasks
  if (criteria.fast && model.fast) {
    score += 10
  } else {
    // Still give some priority for having fast flag when not explicitly requested
    if (model.fast) score += 2
  }

  // Prefer larger context windows
  score += Math.floor(model.contextLength / 64000)

  return score
}

/**
 * Get best matching model for given criteria
 *
 * Selection process:
 * 1. Filter by mandatory criteria (streaming, tools)
 * 2. Filter by minimum context length
 * 3. Filter out fallback if requested
 * 4. Sort by priority (fast, high context)
 * 5. Return best match or fallback
 *
 * @param criteria - Selection requirements
 * @returns Best matching model ID
 * @throws Error if no model matches criteria
 *
 * @example
 * ```ts
 * // Get best free model with streaming and tools
 * const model = getBestModel({
 *   streaming: true,
 *   tools: true,
 *   free: true
 * })
 * // Returns: 'meta-llama/llama-3.1-8b:free'
 *
 * // Get fastest model for simple tasks
 * const model = getBestModel({
 *   streaming: true,
 *   tools: true,
 *   fast: true
 * })
 * // Returns: 'google/gemma-3-4b-it:free'
 * ```
 */
export function getBestModel(criteria: ModelSelectionCriteria = {}): string {
  const {
    streaming = false,
    tools = false,
    free: _free = false,
    fast: _fast = false,
    minContext = 0,
    excludeFallback = false,
  } = criteria

  // Filter models by criteria
  const candidates = Object.values(MODEL_REGISTRY).filter((model) => {
    // Filter by streaming requirement
    if (streaming && !model.streaming) return false

    // Filter by tools requirement
    if (tools && !model.tools) return false

    // Filter by minimum context length
    if (minContext > 0 && model.contextLength < minContext) return false

    // Filter out fallback models if requested
    if (excludeFallback && model.fallback) return false

    return true
  })

  // Sort by priority score
  candidates.sort(
    (a, b) => getModelScore(b, criteria) - getModelScore(a, criteria)
  )

  // Return best match
  if (candidates.length > 0) {
    return candidates[0].id
  }

  // Fallback to default if no matches
  if (!excludeFallback) {
    const fallbackModel = Object.values(MODEL_REGISTRY).find((m) => m.fallback)
    if (fallbackModel) {
      return fallbackModel.id
    }
  }

  throw new Error(
    `No model found matching criteria: ${JSON.stringify(criteria)}`
  )
}

/**
 * Get model capabilities by ID
 *
 * @param modelId - Model identifier
 * @returns Model capabilities or undefined if not found
 */
export function getSelectionModelCapabilities(
  modelId: string
): SelectionModelCapabilities | undefined {
  return MODEL_REGISTRY[modelId]
}

/**
 * Check if model supports a specific capability
 *
 * @param modelId - Model identifier
 * @param capability - Capability to check ('streaming' | 'tools')
 * @returns True if model supports the capability
 */
export function modelSupports(
  modelId: string,
  capability: 'streaming' | 'tools'
): boolean {
  const model = getSelectionModelCapabilities(modelId)
  if (!model) return false

  return capability === 'streaming' ? model.streaming : model.tools
}

/**
 * Get all free models
 *
 * @returns Array of free model IDs
 */
export function getFreeModels(): string[] {
  return Object.values(MODEL_REGISTRY)
    .filter((m) => m.id.includes(':free'))
    .map((m) => m.id)
}

/**
 * Get all fast models
 *
 * @returns Array of fast model IDs
 */
export function getFastModels(): string[] {
  return Object.values(MODEL_REGISTRY)
    .filter((m) => m.fast)
    .map((m) => m.id)
}
