/**
 * Agent Models Endpoint
 *
 * GET /api/v1/agents/models
 *
 * Returns available models with capability indicators fetched from OpenRouter.
 * Used by the frontend to show which models support tools, streaming, etc.
 *
 * Uses Next.js fetch revalidation to avoid refetching OpenRouter too often.
 */

import { NextResponse } from 'next/server'
import {
  AGENT_MODELS,
  formatTokenCount,
  type OpenAIModel,
} from '@/lib/ai/agent-models'

const OPENROUTER_MODELS_API =
  process.env.OPENROUTER_MODELS_API || 'https://openrouter.ai/api/v1/models'
const CACHE_TTL_SECONDS = 5 * 60
const OPENROUTER_REFERER =
  process.env.OPENROUTER_REFERER || 'https://clickhouse.duyet.net'
const OPENROUTER_APP_NAME =
  process.env.OPENROUTER_APP_NAME || 'ClickHouse Monitor'

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

/**
 * Fetch models from OpenRouter and merge with our static AGENT_MODELS metadata.
 */
async function fetchOpenRouterModels(): Promise<ModelCapability[]> {
  const response = await fetch(OPENROUTER_MODELS_API, {
    headers: {
      'HTTP-Referer': OPENROUTER_REFERER,
      'X-OpenRouter-Title': OPENROUTER_APP_NAME,
    },
    next: { revalidate: CACHE_TTL_SECONDS },
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
      supported_parameters?: string[]
      architecture?: {
        input_modalities?: string[]
        output_modalities?: string[]
        modality?: string | string[]
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
        supportedParameters: m.supported_parameters,
      },
    ])
  )

  // Merge our static model list with OpenRouter's capability data
  return Object.entries(AGENT_MODELS).map(([id, info]): ModelCapability => {
    const orData = orModels.get(id)
    const isFree = id.endsWith(':free') || !('pricing' in info)

    const inputModalities = [
      ...(orData?.architecture?.input_modalities ?? []),
      ...(Array.isArray(orData?.architecture?.modality)
        ? (orData?.architecture?.modality ?? [])
        : orData?.architecture?.modality
          ? [orData.architecture.modality]
          : []),
    ]
    const supportedParameters = orData?.supportedParameters ?? []
    const supportsTools =
      supportedParameters.includes('tools') ||
      supportedParameters.includes('tool_choice')
    const supportsStreaming = true
    const supportsVision = inputModalities.some((modality) =>
      modality.toLowerCase().includes('image')
    )

    const result: ModelCapability = {
      id: id as OpenAIModel,
      name: info.name,
      description: info.description,
      contextLength: info.contextLength,
      formattedContextLength: formatTokenCount(info.contextLength),
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
    const models = await fetchOpenRouterModels()

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Failed to fetch models from OpenRouter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model capabilities', models: [] },
      { status: 500 }
    )
  }
}
