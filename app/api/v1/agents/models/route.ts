/**
 * Agent Models Endpoint
 *
 * GET /api/v1/agents/models
 *
 * Returns available models grouped by provider.
 * Generates all valid `provider:model` combinations from MODEL_REGISTRY.
 * Enriches OpenRouter models with capability data from their API.
 */

import { NextResponse } from 'next/server'
import { isFreeAgentModel, MODEL_REGISTRY } from '@/lib/ai/agent-model-registry'
import { authorizeAgentApiRequest } from '@/lib/auth/agent-api-auth'
import { formatCompactNumber } from '@/lib/format-number'

const OPENROUTER_MODELS_API =
  process.env.OPENROUTER_MODELS_API || 'https://openrouter.ai/api/v1/models'
const CACHE_TTL_SECONDS = 5 * 60
const OPENROUTER_REFERER = process.env.OPENROUTER_REFERER
const OPENROUTER_APP_NAME = process.env.OPENROUTER_APP_NAME

interface ModelCapability {
  /** Combined ID in `provider:model` format */
  id: string
  /** Provider-agnostic model ID */
  modelId: string
  /** Provider ID */
  provider: string
  /** Display name */
  name: string
  description: string
  contextLength: number
  formattedContextLength: string
  isFree: boolean
  pricing?: {
    inputPerMillion: number
    outputPerMillion: number
  }
  supportsTools?: boolean
  supportsStreaming?: boolean
  supportsVision?: boolean
}

/**
 * Fetch OpenRouter model metadata for capability enrichment.
 */
async function fetchOpenRouterCapabilities(): Promise<
  Map<string, Record<string, unknown>>
> {
  const response = await fetch(OPENROUTER_MODELS_API, {
    headers: {
      ...(OPENROUTER_REFERER && {
        'HTTP-Referer': OPENROUTER_REFERER,
      }),
      ...(OPENROUTER_APP_NAME && {
        'X-OpenRouter-Title': OPENROUTER_APP_NAME,
      }),
    },
    next: { revalidate: CACHE_TTL_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = (await response.json()) as {
    data: Array<{
      id: string
      context_length?: number
      supported_parameters?: string[]
      architecture?: {
        input_modalities?: string[]
        output_modalities?: string[]
        modality?: string | string[]
      }
    }>
  }

  return new Map(
    data.data.map((m) => [
      m.id,
      {
        contextLength: m.context_length,
        supportedParameters: m.supported_parameters,
        architecture: m.architecture,
      },
    ])
  )
}

function extractCapabilities(
  orData: Record<string, unknown> | undefined
): Pick<
  ModelCapability,
  'supportsTools' | 'supportsStreaming' | 'supportsVision'
> {
  if (!orData) return {}

  const architecture = orData.architecture as ModelCapability extends never
    ? never
    :
        | {
            input_modalities?: string[]
            output_modalities?: string[]
            modality?: string | string[]
          }
        | undefined
  const supportedParameters = (orData as { supportedParameters?: string[] })
    .supportedParameters

  const supportsTools =
    supportedParameters?.includes('tools') ||
    supportedParameters?.includes('tool_choice')

  const rawModality = architecture?.modality
  const modalityList = Array.isArray(rawModality)
    ? rawModality
    : rawModality
      ? [rawModality]
      : []
  const inputModalities = [
    ...(architecture?.input_modalities ?? []),
    ...modalityList.map((m: string) => m.split('->')[0] ?? ''),
  ].map((m: string) => m.trim().toLowerCase())

  const supportsStreaming =
    architecture?.output_modalities?.includes('text') ?? false
  const supportsVision = inputModalities.some((m: string) =>
    m.includes('image')
  )

  return { supportsTools, supportsStreaming, supportsVision }
}

function buildStaticModels(): ModelCapability[] {
  const result: ModelCapability[] = []

  for (const entry of MODEL_REGISTRY) {
    for (const provider of entry.providers) {
      const id = `${provider}:${entry.id}`
      const isFree = isFreeAgentModel(entry.id)

      result.push({
        id,
        modelId: entry.id,
        provider,
        name: entry.id,
        description: entry.description,
        contextLength: entry.contextLength,
        formattedContextLength: formatCompactNumber(entry.contextLength),
        isFree,
        pricing: entry.pricing,
      })
    }
  }

  return result
}

async function buildModels(): Promise<ModelCapability[]> {
  let orCapabilities: Map<string, Record<string, unknown>> | undefined

  try {
    orCapabilities = await fetchOpenRouterCapabilities()
  } catch {
    // OpenRouter API unavailable — return static metadata only
  }

  const result: ModelCapability[] = []

  for (const entry of MODEL_REGISTRY) {
    for (const provider of entry.providers) {
      const id = `${provider}:${entry.id}`
      const isFree = isFreeAgentModel(entry.id)
      const orData = orCapabilities?.get(entry.id)

      // Enrich context length from OpenRouter if available
      const contextLength =
        (orData?.contextLength as number | undefined) ?? entry.contextLength

      const capabilities = extractCapabilities(orData)

      result.push({
        id,
        modelId: entry.id,
        provider,
        name: entry.id,
        description: entry.description,
        contextLength,
        formattedContextLength: formatCompactNumber(contextLength),
        isFree,
        pricing: entry.pricing,
        ...capabilities,
      })
    }
  }

  return result
}

export async function GET(request: Request) {
  const authResponse = await authorizeAgentApiRequest(request)
  if (authResponse) return authResponse

  try {
    const models = await buildModels()
    return NextResponse.json({ models })
  } catch (error) {
    console.error('Failed to build models:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch model capabilities',
        models: buildStaticModels(),
      },
      { status: 500 }
    )
  }
}
