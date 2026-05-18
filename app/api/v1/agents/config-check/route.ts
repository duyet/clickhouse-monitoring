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
import { isProviderConfigured, PROVIDERS } from '@/lib/ai/providers'
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

function getRequiredApiKeyLabel(): string {
  const providerKeys = Object.values(PROVIDERS).map(
    (provider) => provider.apiKeyEnvVar
  )
  return `${providerKeys.join(', ')}, or LLM_API_KEY`
}

/**
 * Handle GET requests for config status
 *
 * Note: LLM_MODEL is not required as it has a default value and can be
 * selected via UI dropdown. OpenAI-compatible providers ship default base
 * URLs, so only at least one provider key is required.
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

    const configured: ConfigStatus['configured'] = {
      apiKey: providers.some((provider) => provider.configured),
      apiBase: true,
    }

    const isFullyConfigured = configured.apiKey

    const requiredKeys: ConfigStatus['requiredKeys'] = {
      apiKey: getRequiredApiKeyLabel(),
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
