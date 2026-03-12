/**
 * useAgentModel Hook
 *
 * Client-side hook for managing OpenAI model selection for the agent.
 * Persists selection to localStorage and provides model metadata.
 */

import { useMemo } from 'react'

/**
 * LocalStorage key for model selection
 */
const MODEL_STORAGE_KEY = 'clickhouse-monitor-agent-model'

/**
 * Available OpenAI models
 */
export const OPENAI_MODELS = {
  'gpt-4o': {
    name: 'GPT-4o',
    description: 'Most capable model for complex tasks',
    contextLength: 128000,
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    description: 'Fast and efficient model',
    contextLength: 128000,
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    description: 'Balanced performance model',
    contextLength: 128000,
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'Fastest model for simple tasks',
    contextLength: 16385,
  },
} as const

export type OpenAIModel = keyof typeof OPENAI_MODELS

/**
 * Get default model from environment or fallback
 */
function getDefaultModel(): OpenAIModel {
  // Check environment variable first
  const envModel = process.env.NEXT_PUBLIC_OPENAI_MODEL
  if (envModel && envModel in OPENAI_MODELS) {
    return envModel as OpenAIModel
  }

  // Fall back to gpt-4o-mini (best balance)
  return 'gpt-4o-mini'
}

/**
 * Get saved model from localStorage or return default
 */
export function getSavedModel(): OpenAIModel {
  if (typeof window === 'undefined') return getDefaultModel()

  try {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY)
    if (saved && saved in OPENAI_MODELS) {
      return saved as OpenAIModel
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
 * <select value={model} onChange={(e) => setModel(e.target.value as OpenAIModel)}>
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
    return Object.entries(OPENAI_MODELS).map(
      ([id, info]): ModelDisplayInfo => ({
        id: id as OpenAIModel,
        name: info.name,
        description: info.description,
        contextLength: info.contextLength,
      })
    )
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
