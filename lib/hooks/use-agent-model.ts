/**
 * useAgentModel Hook
 *
 * Client-side hook for managing LLM model selection for the agent.
 * Persists selection to localStorage and provides model metadata.
 */

import { useMemo } from 'react'
import {
  getBestModel,
  getFreeModels,
  getSelectionModelCapabilities,
  MODEL_REGISTRY,
} from '@/lib/agents/llm/model-registry'
import { getModelCapabilities } from '@/lib/agents/llm/openrouter'

/**
 * LocalStorage key for model selection
 */
const MODEL_STORAGE_KEY = 'clickhouse-monitor-agent-model'

/**
 * Get default model from environment or registry
 */
function getDefaultModel(): string {
  // Check environment variable first
  const envModel = process.env.NEXT_PUBLIC_LLM_MODEL
  if (envModel) return envModel

  // Fall back to best free model from registry
  return getBestModel({ streaming: true, tools: true })
}

/**
 * Get saved model from localStorage or return default
 */
export function getSavedModel(): string {
  if (typeof window === 'undefined') return getDefaultModel()

  try {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY)
    if (saved && MODEL_REGISTRY[saved]) {
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
function saveModel(model: string): void {
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
  id: string
  /** Display name (shortened) */
  name: string
  /** Full model ID for display */
  fullName: string
  /** Supports streaming */
  streaming: boolean
  /** Supports tools */
  tools: boolean
  /** Context length in tokens */
  contextLength: number
  /** Optimized for speed */
  fast?: boolean
  /** Is a fallback model */
  fallback?: boolean
}

/**
 * Agent model hook result
 */
export interface UseAgentModelResult {
  /** Currently selected model */
  model: string
  /** All available models with metadata */
  models: readonly ModelDisplayInfo[]
  /** Capabilities of current model */
  capabilities: ReturnType<typeof getModelCapabilities>
  /** Update the selected model */
  setModel: (model: string) => void
  /** Reset to default model */
  resetModel: () => void
}

/**
 * Format model ID for display
 */
function formatModelName(modelId: string): string {
  // Remove provider prefix for cleaner display
  // e.g., "meta-llama/llama-3.1-8b:free" → "Llama 3.1 8B"
  // e.g., "google/gemma-3-4b-it:free" → "Gemma 3 4B"

  const parts = modelId.split('/')
  if (parts.length < 2) return modelId

  const name = parts[parts.length - 1] // Get last part (model name)
    .replace(/:free$/, '') // Remove :free suffix
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/\b(\w)/g, (_, char) => char.toUpperCase()) // Capitalize

  return name
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
 * const { model, models, setModel, capabilities } = useAgentModel()
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

  // Get all free models from registry
  const models = useMemo(() => {
    return getFreeModels().map((modelId): ModelDisplayInfo => {
      const registryCaps = getSelectionModelCapabilities(modelId)
      const llmCaps = getModelCapabilities(modelId)

      return {
        id: modelId,
        name: formatModelName(modelId),
        fullName: modelId,
        streaming: registryCaps?.streaming ?? llmCaps.streaming,
        tools: registryCaps?.tools ?? llmCaps.tools,
        contextLength: registryCaps?.contextLength ?? llmCaps.contextLength,
        fast: registryCaps?.fast,
        fallback: registryCaps?.fallback,
      }
    })
  }, [])

  // Get capabilities of current model
  const capabilities = useMemo(() => getModelCapabilities(model), [model])

  // Update model selection
  const setModel = (newModel: string): void => {
    saveModel(newModel)
    // Force re-render by reloading the page (simplest approach)
    // In a more complex app, we'd use React state + context
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
    capabilities,
    setModel,
    resetModel,
  }
}
