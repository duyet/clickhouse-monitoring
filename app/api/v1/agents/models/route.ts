/**
 * Agent Models Endpoint
 *
 * GET /api/v1/agents/models
 *
 * Returns available models with capability indicators fetched from OpenRouter.
 * Used by the frontend to show which models support tools, streaming, etc.
 *
 * Caches the OpenRouter response for 5 minutes to avoid rate limiting.
 */

import { NextResponse } from 'next/server'
import { AGENT_MODELS, type OpenAIModel } from '@/lib/hooks/use-agent-model'

const OPENROUTER_MODELS_API = 'https://openrouter.ai/api/v1/models'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface ModelCapability {
  id: OpenAIModel
  name: string
  description: string
  contextLength: number
  formattedContextLength: string
  isFree: boolean
  supportsTools: boolean
  supportsStreaming: boolean
  supportsVision: boolean
  pricing?: {
    inputPerMillion: number
    outputPerMillion: number
  }
}

let cachedModels: ModelCapability[] | null = null
let cacheTime = 0

/**
 * Fetch models from OpenRouter and merge with our static AGENT_MODELS metadata.
 */
async function fetchOpenRouterModels(): Promise<ModelCapability[]> {
  const response = await fetch(OPENROUTER_MODELS_API, {
    headers: {
      // OpenRouter requires identification
      'HTTP-Referer': 'https://clickhouse.duyet.net',
      'X-OpenRouter-Title': 'ClickHouse Monitor',
    },
    next: { revalidate: CACHE_TTL / 1000 },
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = (await response.json()) as {
    data: Array<{
      id: string
      name: string
      description?: string
      context_length: number
      pricing?: {
        prompt: string
        completion: string
      }
      architecture?: {
        modality: string[]
      }
    }>
  }

  // Build a map of OpenRouter models by ID for quick lookup
  const orModels = new Map(
    data.data.map((m) => [
      m.id,
      {
        name: m.name,
        description: m.description,
        contextLength: m.context_length,
        pricing: m.pricing,
        architecture: m.architecture,
      },
    ])
  )

  // Merge our static model list with OpenRouter's capability data
  return Object.entries(AGENT_MODELS).map(([id, info]): ModelCapability => {
    const orData = orModels.get(id)
    const isFree = id.endsWith(':free') || !('pricing' in info)

    // Determine capabilities from OpenRouter data or defaults
    // Most modern models support streaming; tools support is more selective
    const supportsStreaming =
      orData?.architecture?.modality?.includes('text') ?? true
    const supportsTools =
      orData?.architecture?.modality?.includes('text+tool_calling') ?? false
    const supportsVision =
      orData?.architecture?.modality?.includes('image') ?? false

    const result: ModelCapability = {
      id: id as OpenAIModel,
      name: info.name,
      description: info.description,
      contextLength: info.contextLength,
      formattedContextLength: info.contextLength.toLocaleString(),
      isFree,
      supportsTools,
      supportsStreaming,
      supportsVision,
    }

    // Only include pricing if defined
    if ('pricing' in info && info.pricing) {
      result.pricing = info.pricing
    }

    return result
  })
}

/**
 * Handle GET requests for models with capabilities
 */
export async function GET() {
  try {
    // Check cache
    const now = Date.now()
    if (cachedModels && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ models: cachedModels })
    }

    // Fetch from OpenRouter
    const models = await fetchOpenRouterModels()

    // Update cache
    cachedModels = models
    cacheTime = now

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Failed to fetch models from OpenRouter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model capabilities', models: [] },
      { status: 500 }
    )
  }
}
