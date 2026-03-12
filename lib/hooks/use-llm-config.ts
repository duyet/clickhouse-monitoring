/**
 * useLLMConfig Hook
 *
 * Client-side hook that checks if LLM configuration is present.
 * Queries the /api/v1/agents/config-check endpoint to determine
 * which config keys are missing.
 */

import useSWR from 'swr'

import { swrConfig } from '@/lib/swr/config'

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
}

interface LLMConfigResult {
  isConfigured: boolean
  missingKeys: string[]
  isLoading: boolean
  error: Error | undefined
}

/**
 * Fetches LLM config status from the API
 */
async function fetchConfigStatus(): Promise<ConfigStatus> {
  const response = await fetch('/api/v1/agents/config-check')
  if (!response.ok) {
    throw new Error(`Failed to check config: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Hook to check if LLM configuration is present
 *
 * @returns Object with config status, missing keys, and loading/error states
 *
 * @example
 * ```tsx
 * const { isConfigured, missingKeys, isLoading } = useLLMConfig()
 *
 * if (isLoading) return <Skeleton />
 * if (!isConfigured) {
 *   return <AgentConfigGuidance missingKeys={missingKeys} />
 * }
 * ```
 */
export function useLLMConfig(): LLMConfigResult {
  const { data, isLoading, error } = useSWR<ConfigStatus>(
    '/api/v1/agents/config-check',
    fetchConfigStatus,
    {
      ...swrConfig.once,
      dedupingInterval: 300_000, // Cache for 5 minutes (config is static during session)
      shouldRetryOnError: false,
    }
  )

  // When API call fails, assume config is OK rather than missing
  // If config is truly missing, the agent API call itself will fail
  const isConfigured = error ? true : (data?.isFullyConfigured ?? false)

  const missingKeys =
    data && !error
      ? Object.entries(data.configured)
          .filter(([_, isPresent]) => !isPresent)
          .map(
            ([key]) => data.requiredKeys[key as keyof typeof data.requiredKeys]
          )
      : []

  return {
    isConfigured,
    missingKeys,
    isLoading,
    error,
  }
}
