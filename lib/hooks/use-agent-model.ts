/**
 * useAgentModel Hook
 *
 * Client-side hook for managing agent model selection.
 * Persists selection to localStorage and provides model metadata.
 */

import { useMemo } from 'react'

/**
 * LocalStorage key for model selection
 */
const MODEL_STORAGE_KEY = 'clickhouse-monitor-agent-model'

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
  },
  'openai/gpt-5.4-nano': {
    name: 'openai/gpt-5.4-nano',
    description: 'OpenAI nano model',
    contextLength: 128000,
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

export type OpenAIModel = keyof typeof AGENT_MODELS

/**
 * Get default model from environment or fallback
 */
function getDefaultModel(): OpenAIModel {
  // Check if LLM_MODEL env var is set and valid
  const envModel = process.env.LLM_MODEL
  if (envModel && envModel in AGENT_MODELS) {
    return envModel as OpenAIModel
  }
  // Fallback to the nano OpenAI model.
  return 'openai/gpt-5.4-nano'
}

/**
 * Get saved model from localStorage or return default
 */
export function getSavedModel(): OpenAIModel {
  if (typeof window === 'undefined') return getDefaultModel()

  try {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY)
    if (saved && saved in AGENT_MODELS) {
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
    return Object.entries(AGENT_MODELS).map(
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
