/**
 * useAgentModel Hook
 *
 * Client-side hook for managing agent model selection.
 * Persists selection to localStorage and provides model metadata.
 */

import { useMemo } from 'react'
import { formatCompactNumber } from '@/lib/format-number'

/**
 * LocalStorage key for model selection
 */
const MODEL_STORAGE_KEY = 'clickhouse-monitor-agent-model'

const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

/**
 * Format a token count to a compact human-readable string.
 * Examples: 128000 → "128K", 1000000 → "1M", 32768 → "32.8K"
 */
export function formatTokenCount(count: number): string {
  return formatCompactNumber(count)
}

/**
 * Available agent models.
 *
 * Keep `name` identical to the model code so the UI always shows
 * the exact provider/model identifier chosen by the user.
 */
export const AGENT_MODELS = {
  'nvidia/nemotron-3-super-120b-a12b:free': {
    name: 'nvidia/nemotron-3-super-120b-a12b:free',
    description: 'NVIDIA model available by default',
    contextLength: 128000,
  },
  'stepfun/step-3.5-flash:free': {
    name: 'stepfun/step-3.5-flash:free',
    description: 'StepFun model available by default',
    contextLength: 128000,
  },
  'z-ai/glm-4.5-air:free': {
    name: 'z-ai/glm-4.5-air:free',
    description: 'Z.AI model available by default',
    contextLength: 128000,
  },
  'nvidia/nemotron-3-nano-30b-a3b:free': {
    name: 'nvidia/nemotron-3-nano-30b-a3b:free',
    description: 'Compact NVIDIA model available by default',
    contextLength: 128000,
  },
  'minimax/minimax-m2.7': {
    name: 'minimax/minimax-m2.7',
    description: 'MiniMax production model',
    contextLength: 128000,
    pricing: {
      inputPerMillion: 0.5,
      outputPerMillion: 1.5,
    },
  },
  'openai/gpt-5.4-nano': {
    name: 'openai/gpt-5.4-nano',
    description: 'OpenAI nano model',
    contextLength: 128000,
    pricing: {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6,
    },
  },
  'google/gemma-3-27b-it:free': {
    name: 'google/gemma-3-27b-it:free',
    description: 'Google, free tier, Gemma instruct model',
    contextLength: 128000,
  },
  'meta-llama/llama-3.1-8b-instruct:free': {
    name: 'meta-llama/llama-3.1-8b-instruct:free',
    description: 'Meta, free tier, compact instruct model',
    contextLength: 128000,
  },
} as const

/** OpenAI-compatible model identifier — any string is valid (custom models supported) */
export type OpenAIModel = string

/**
 * Check whether a model ID is in the known AGENT_MODELS list
 */
export function isKnownModel(
  model: string
): model is keyof typeof AGENT_MODELS {
  return model in AGENT_MODELS
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
 * Pricing information for a model (USD per 1M tokens)
 */
export interface ModelPricing {
  inputPerMillion: number
  outputPerMillion: number
}

/**
 * Model display metadata
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
 * Hook for managing agent model selection
 *
 * Provides model selection state with localStorage persistence
 * and model metadata for UI rendering.
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

  // Get all available models
  const models = useMemo(() => {
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
