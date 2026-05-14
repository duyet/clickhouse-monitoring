'use client'

/**
 * useAgentModel Hook
 *
 * Client-side hook for managing agent model selection.
 * Persists selection to localStorage and provides model metadata.
 *
 * Model IDs use `provider:model` format (e.g., `openrouter:qwen/qwen3-coder:free`).
 * Legacy IDs without `:` are treated as `openrouter:{model}`.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  getAllModelOptions,
  MODEL_REGISTRY,
} from '@/lib/ai/agent-model-registry'
import {
  formatTokenCount,
  isFreeAgentModel,
  type ModelPricing,
  type OpenAIModel,
} from '@/lib/ai/agent-models'
import { apiFetch } from '@/lib/swr/api-fetch'

export type { OpenAIModel } from '@/lib/ai/agent-models'

const MODEL_STORAGE_KEY = 'clickhouse-monitor-agent-model'

const DEFAULT_MODEL = 'openrouter:openrouter/auto'

/**
 * Normalize a model ID to `provider:model` format.
 * Legacy IDs without `:` get `openrouter:` prefix.
 */
function normalizeModelId(id: string): string {
  if (id.includes(':')) return id
  return `openrouter:${id}`
}

function getDefaultModel(): OpenAIModel {
  const envModel = process.env.LLM_MODEL
  if (envModel) return normalizeModelId(envModel)
  return DEFAULT_MODEL
}

export function getSavedModel(): OpenAIModel {
  if (typeof window === 'undefined') return getDefaultModel()

  try {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY)
    if (saved && saved.trim().length > 0) {
      return normalizeModelId(saved)
    }
  } catch {
    // localStorage may be disabled
  }

  return getDefaultModel()
}

function saveModel(model: OpenAIModel): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(MODEL_STORAGE_KEY, model)
  } catch {
    // localStorage may be disabled
  }
}

export interface ModelDisplayInfo {
  id: OpenAIModel
  modelId: string
  provider: string
  name: string
  description: string
  contextLength: number
  formattedContextLength: string
  isFree: boolean
  pricing?: ModelPricing
  supportsTools?: boolean
  supportsStreaming?: boolean
  supportsVision?: boolean
}

export interface UseAgentModelResult {
  model: OpenAIModel
  models: readonly ModelDisplayInfo[]
  setModel: (model: OpenAIModel) => void
  resetModel: () => void
}

function getStaticModels(): ModelDisplayInfo[] {
  return getAllModelOptions().map((id): ModelDisplayInfo => {
    const idx = id.indexOf(':')
    const provider = id.slice(0, idx)
    const modelId = id.slice(idx + 1)
    const entry = MODEL_REGISTRY.find((m) => m.id === modelId)
    const isFree = isFreeAgentModel(modelId)

    return {
      id,
      modelId,
      provider,
      name: modelId,
      description: entry?.description ?? modelId,
      contextLength: entry?.contextLength ?? 131_072,
      formattedContextLength: formatTokenCount(entry?.contextLength ?? 131_072),
      isFree,
      pricing: entry?.pricing,
    }
  })
}

async function fetchModelsWithCapabilities(): Promise<ModelDisplayInfo[]> {
  try {
    const response = await apiFetch('/api/v1/agents/models')
    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }
    const data = (await response.json()) as { models: ModelDisplayInfo[] }
    return data.models
  } catch {
    return getStaticModels()
  }
}

export function useAgentModel(): UseAgentModelResult {
  const model = useMemo(() => getSavedModel(), [])

  const [models, setModels] = useState<ModelDisplayInfo[]>(getStaticModels)

  useEffect(() => {
    let cancelled = false

    async function loadModels() {
      const nextModels = await fetchModelsWithCapabilities()
      if (!cancelled && nextModels.length > 0) {
        setModels(nextModels)
      }
    }

    loadModels()

    return () => {
      cancelled = true
    }
  }, [])

  const setModel = (newModel: OpenAIModel): void => {
    saveModel(newModel)
    window.location.reload()
  }

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
