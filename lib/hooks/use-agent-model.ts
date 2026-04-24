'use client'

/**
 * useAgentModel Hook
 *
 * Client-side hook for managing agent model selection.
 * Persists selection to localStorage and provides model metadata.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  AGENT_MODELS,
  isKnownModel,
  type ModelPricing,
  type OpenAIModel,
} from '@/lib/ai/agent-models'
import { formatCompactNumber } from '@/lib/format-number'

export type { OpenAIModel } from '@/lib/ai/agent-models'

/**
 * LocalStorage key for model selection
 */
const MODEL_STORAGE_KEY = 'clickhouse-monitor-agent-model'

const DEFAULT_MODEL = 'openrouter/free'

/**
 * Format a token count to a compact human-readable string.
 * Examples: 128000 → "128K", 1000000 → "1M", 32768 → "32.8K"
 */
export function formatTokenCount(count: number): string {
  return formatCompactNumber(count)
}

/**
 * Get default model from environment or fallback
 */
function getDefaultModel(): OpenAIModel {
  // Check if LLM_MODEL env var is set
  const envModel = process.env.LLM_MODEL
  if (envModel) {
    return envModel
  }
  // Fallback to the default free OpenRouter-backed model.
  return DEFAULT_MODEL
}

/**
 * Get saved model from localStorage or return default.
 * Accepts any string, including custom model IDs.
 */
export function getSavedModel(): OpenAIModel {
  if (typeof window === 'undefined') return getDefaultModel()

  try {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY)
    if (saved && saved.trim().length > 0) {
      return saved
    }
  } catch {
    // localStorage may be disabled
  }

  return getDefaultModel()
}

/**
 * Save model to localStorage
 */
function saveModel(model: OpenAIModel): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(MODEL_STORAGE_KEY, model)
  } catch {
    // localStorage may be disabled
  }
}

/**
 * Model display metadata with capability indicators
 */
export interface ModelDisplayInfo {
  /** Model ID */
  id: OpenAIModel
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Context length in tokens */
  contextLength: number
  /** Compact formatted context length, e.g. "128K" */
  formattedContextLength: string
  /** Whether this is a free model (no pricing) */
  isFree: boolean
  /** Pricing info for paid models */
  pricing?: ModelPricing
  /** Whether the model supports tool/function calling */
  supportsTools?: boolean
  /** Whether the model supports streaming responses */
  supportsStreaming?: boolean
  /** Whether the model supports vision/image input */
  supportsVision?: boolean
}

/**
 * Agent model hook result
 */
export interface UseAgentModelResult {
  /** Currently selected model */
  model: OpenAIModel
  /** All available models with metadata */
  models: readonly ModelDisplayInfo[]
  /** Update the selected model */
  setModel: (model: OpenAIModel) => void
  /** Reset to default model */
  resetModel: () => void
}

/**
 * Fetch models with capability indicators from the API
 */
async function fetchModelsWithCapabilities(): Promise<ModelDisplayInfo[]> {
  try {
    const response = await fetch('/api/v1/agents/models')
    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }
    const data = (await response.json()) as { models: ModelDisplayInfo[] }
    return data.models
  } catch {
    // Fallback to static models without capabilities
    return Object.entries(AGENT_MODELS).map(([id, info]): ModelDisplayInfo => {
      const isFree = id.endsWith(':free') || !('pricing' in info)
      const pricing =
        'pricing' in info ? (info.pricing as ModelPricing) : undefined

      return {
        id,
        name: info.name,
        description: info.description,
        contextLength: info.contextLength,
        formattedContextLength: formatTokenCount(info.contextLength),
        isFree,
        pricing,
      }
    })
  }
}

/**
 * Hook for managing agent model selection
 *
 * Provides model selection state with localStorage persistence
 * and model metadata for UI rendering. Fetches capability indicators
 * from OpenRouter via the API.
 *
 * @returns Model selection state and actions
 *
 * @example
 * ```tsx
 * const { model, models, setModel } = useAgentModel()
 *
 * <select value={model} onChange={(e) => setModel(e.target.value)}>
 *   {models.map((m) => (
 *     <option key={m.id} value={m.id}>{m.name}</option>
 *   ))}
 * </select>
 * ```
 */
export function useAgentModel(): UseAgentModelResult {
  // Get current model (uses saved value or default)
  const model = useMemo(() => getSavedModel(), [])

  // Get all available models with capabilities
  const [models, setModels] = useState<ModelDisplayInfo[]>([])

  // Fetch models on mount
  useEffect(() => {
    fetchModelsWithCapabilities().then(setModels)
  }, [])

  // Update model selection
  const setModel = (newModel: OpenAIModel): void => {
    saveModel(newModel)
    // Force re-render by reloading the page (simplest approach)
    window.location.reload()
  }

  // Reset to default
  const resetModel = (): void => {
    saveModel(getDefaultModel())
    window.location.reload()
  }

  return {
    model,
    models,
    setModel,
    resetModel,
  }
}
