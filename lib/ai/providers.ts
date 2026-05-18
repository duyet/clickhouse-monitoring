/**
 * Provider Registry
 *
 * Server-only module that maps model IDs to provider configurations
 * and resolves credentials from environment variables.
 *
 * Model ID format: `provider:model_name` (e.g., `nvidia:nvidia/llama-3.1-nemotron-70b-instruct`)
 * Legacy format (no colon) is treated as `openrouter:{model}` for backward compatibility.
 */

import 'server-only'

export interface ProviderConfig {
  /** Unique provider identifier (e.g., 'openrouter', 'nvidia', 'anyrouter') */
  id: string
  /** Human-readable display name */
  name: string
  /** Primary env var name for the API key */
  apiKeyEnvVar: string
  /** Default base URL for the provider's API */
  baseURL: string
  /** Optional env var name to override the default base URL */
  baseURLEnvVar?: string
  /** Which SDK to use for this provider */
  sdk: 'openrouter' | 'openai'
}

/**
 * Provider configurations. Each provider has its own credentials
 * that fall back to LLM_API_KEY / LLM_API_BASE if not set.
 */
export const PROVIDERS: Record<string, ProviderConfig> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    baseURL: 'https://openrouter.ai/api/v1',
    baseURLEnvVar: 'OPENROUTER_API_BASE',
    sdk: 'openrouter',
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    apiKeyEnvVar: 'NVIDIA_API_KEY',
    baseURL: 'https://integrate.api.nvidia.com/v1',
    baseURLEnvVar: 'NVIDIA_API_BASE',
    sdk: 'openai',
  },
  anyrouter: {
    id: 'anyrouter',
    name: 'AnyRouter',
    apiKeyEnvVar: 'ANYROUTER_API_KEY',
    baseURL: 'https://anyrouter.dev/api/v1',
    baseURLEnvVar: 'ANYROUTER_API_BASE',
    sdk: 'openai',
  },
}

const KNOWN_PROVIDERS = new Set(Object.keys(PROVIDERS))

/**
 * Parse a model ID into its provider and model parts.
 *
 * Format: `provider:model_name` where provider is a known provider ID.
 * Legacy: if the prefix before `:` is not a known provider, the whole
 * string is treated as a model name with provider defaulting to 'openrouter'.
 * This handles cases like `qwen/qwen3-coder:free` where `:` is part of the
 * model ID, not a provider separator.
 */
export function parseModelId(id: string): { provider: string; model: string } {
  const idx = id.indexOf(':')
  if (idx !== -1) {
    const prefix = id.slice(0, idx)
    if (KNOWN_PROVIDERS.has(prefix)) {
      return { provider: prefix, model: id.slice(idx + 1) }
    }
  }
  return { provider: 'legacy', model: id }
}

export interface ResolvedProvider {
  providerId: string
  apiKey: string
  baseURL: string
  sdk: 'openrouter' | 'openai'
  isOpenRouter: boolean
}

/**
 * Resolve provider config for a model ID.
 *
 * Resolution order:
 * 1. `provider:model` format → lookup in PROVIDERS registry
 * 2. Legacy (no colon) → detect from model name (free/openrouter prefix → OpenRouter)
 * 3. Fallback → generic OpenAI-compatible with LLM_API_KEY / LLM_API_BASE
 *
 * Credential cascade for each provider:
 * - API key: provider-specific env var → LLM_API_KEY
 * - Base URL: provider-specific env var → provider default → LLM_API_BASE
 */
export function resolveProvider(id: string): ResolvedProvider {
  const { provider: providerId, model } = parseModelId(id)

  // Legacy model IDs without a recognized provider prefix
  if (!PROVIDERS[providerId]) {
    const isOpenRouter =
      model.endsWith(':free') ||
      model === 'openrouter/free' ||
      model.startsWith('openrouter/')
    return {
      providerId: 'openrouter',
      apiKey: process.env.LLM_API_KEY || '',
      baseURL: process.env.LLM_API_BASE || 'https://openrouter.ai/api/v1',
      sdk: isOpenRouter ? 'openrouter' : 'openai',
      isOpenRouter,
    }
  }

  const config = PROVIDERS[providerId]
  const apiKey =
    process.env[config.apiKeyEnvVar] ||
    (providerId === 'openrouter' ? process.env.LLM_API_KEY || '' : '')
  const baseURL =
    (config.baseURLEnvVar && process.env[config.baseURLEnvVar]) ||
    config.baseURL

  return {
    providerId: config.id,
    apiKey,
    baseURL,
    sdk: config.sdk,
    isOpenRouter: config.sdk === 'openrouter',
  }
}

/**
 * Check whether a provider has an API key configured on this deployment.
 * Mirrors `resolveProvider`'s key cascade: provider-specific env var → LLM_API_KEY.
 */
export function isProviderConfigured(providerId: string): boolean {
  const config = PROVIDERS[providerId]
  if (!config) {
    // Unknown providers fall through to legacy openrouter path → uses LLM_API_KEY.
    return Boolean(process.env.LLM_API_KEY)
  }
  return Boolean(process.env[config.apiKeyEnvVar] || process.env.LLM_API_KEY)
}

/**
 * Human-readable name for a provider id (for error messages).
 */
export function getProviderName(providerId: string): string {
  return PROVIDERS[providerId]?.name ?? providerId
}
