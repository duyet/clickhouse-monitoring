/**
 * Agent LLM Config Check Endpoint
 *
 * GET /api/v1/agents/config-check
 *
 * Returns the status of LLM configuration for the AI agent.
 * Used by the frontend to determine if the agent is properly configured
 * and which environment variables are missing.
 */

import { NextResponse } from 'next/server'
import { DEFAULT_AGENT_MODEL } from '@/lib/ai/agent-model-registry'
import {
  isProviderConfigured,
  PROVIDERS,
  parseModelId,
} from '@/lib/ai/providers'
import { authorizeAgentApiRequest } from '@/lib/auth/agent-api-auth'

interface ConfigStatus {
  configured: {
    apiKey: boolean
    apiBase: boolean
  }
  isFullyConfigured: boolean
  requiredKeys: {
    apiKey: string
    apiBase: string
  }
  providers: Array<{
    id: string
    name: string
    configured: boolean
    apiKeyEnvVar: string
    hasBaseURLOverride: boolean
    baseURL: string
  }>
}

function getSelectedModel(): string {
  const configuredModel = process.env.LLM_MODEL?.trim()
  return configuredModel || DEFAULT_AGENT_MODEL
}

function getSelectedProviderId(model: string): string {
  const { provider } = parseModelId(model)
  return PROVIDERS[provider] ? provider : 'legacy'
}

function getRequiredApiKeyLabel(providerId: string): string {
  if (providerId === 'legacy') return 'LLM_API_KEY'

  const provider = PROVIDERS[providerId]
  if (!provider) return 'LLM_API_KEY'

  return providerId === 'openrouter'
    ? `${provider.apiKeyEnvVar} or LLM_API_KEY`
    : provider.apiKeyEnvVar
}

/**
 * Handle GET requests for config status
 *
 * Note: LLM_MODEL has a default value and can be selected via UI dropdown.
 * Readiness is checked against the selected/default model provider so the
 * first agent request does not fail provider preflight.
 */
export async function GET(request: Request) {
  try {
    const authResponse = await authorizeAgentApiRequest(request)
    if (authResponse) return authResponse

    const providers = Object.values(PROVIDERS).map((provider) => {
      const hasBaseURLOverride = Boolean(
        provider.baseURLEnvVar && process.env[provider.baseURLEnvVar]
      )
      return {
        id: provider.id,
        name: provider.name,
        configured: isProviderConfigured(provider.id),
        apiKeyEnvVar: provider.apiKeyEnvVar,
        hasBaseURLOverride,
        baseURL: hasBaseURLOverride ? 'custom' : provider.baseURL,
      }
    })

    const selectedProviderId = getSelectedProviderId(getSelectedModel())
    const selectedProviderConfigured = isProviderConfigured(selectedProviderId)

    const configured: ConfigStatus['configured'] = {
      apiKey: selectedProviderConfigured,
      apiBase: true,
    }

    const isFullyConfigured = configured.apiKey

    const requiredKeys: ConfigStatus['requiredKeys'] = {
      apiKey: getRequiredApiKeyLabel(selectedProviderId),
      apiBase: 'Provider default base URL',
    }

    return NextResponse.json({
      configured,
      isFullyConfigured,
      requiredKeys,
      providers,
    } satisfies ConfigStatus)
  } catch (error) {
    console.error('[Agent Config Check] Failed to read config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
