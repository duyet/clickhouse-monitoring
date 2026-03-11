/**
 * OpenRouter LLM Configuration
 *
 * This module provides the configuration for using OpenRouter as the LLM provider.
 * OpenRouter acts as a unified API gateway for multiple LLM providers, including:
 * - Free models from various providers
 * - Anthropic (Claude)
 * - OpenAI (GPT)
 * - Google (Gemini)
 * - Meta (Llama)
 * - And many more
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Configuration
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Required environment variables:
 * - LLM_API_KEY: Your OpenRouter API key
 * - LLM_API_BASE: https://openrouter.ai/api/v1 (default)
 * - LLM_MODEL: Model identifier (default: openrouter/free)
 *
 * Get your API key at: https://openrouter.ai/keys
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * OpenRouter base URL
 */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

/**
 * Default OpenRouter model (routes to various free models)
 */
export const OPENROUTER_DEFAULT_MODEL = 'openrouter/free'

/**
 * Popular OpenRouter model options
 *
 * Free tier models:
 * - openrouter/free: Auto-routes to available free models
 * - google/gemma-2-9b:free: Google Gemma 2 9B (free tier)
 * - meta-llama/llama-3-8b:free: Meta Llama 3 8B (free tier)
 *
 * Paid models (require API balance):
 * - anthropic/claude-3.5-sonnet: Latest Claude
 * - openai/gpt-4o: Latest GPT-4
 * - google/gemini-pro-1.5: Latest Gemini
 */
export const OPENROUTER_MODELS = {
  free: 'openrouter/free',
  gemma_free: 'google/gemma-2-9b:free',
  llama_free: 'meta-llama/llama-3-8b:free',
  claude: 'anthropic/claude-3.5-sonnet',
  gpt4: 'openai/gpt-4o',
  gemini: 'google/gemini-pro-1.5',
} as const

/**
 * Get OpenRouter configuration for ChatOpenAI
 *
 * OpenRouter is compatible with the OpenAI API format, so we can use
 * ChatOpenAI with custom configuration.
 *
 * @param apiKey - OpenRouter API key
 * @returns Configuration object for ChatOpenAI
 */
export function OPENROUTER_CONFIG(apiKey: string) {
  return {
    apiKey,
    model: process.env.LLM_MODEL || OPENROUTER_DEFAULT_MODEL,
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/duyet/clickhouse-monitoring',
        'X-Title': 'ClickHouse Monitor',
      },
    },
  }
}

/**
 * Get the model name from environment or default
 */
export function getModelName(): string {
  return process.env.LLM_MODEL || OPENROUTER_DEFAULT_MODEL
}

/**
 * Validate OpenRouter configuration
 *
 * Checks that required environment variables are set.
 * Throws an error if configuration is invalid.
 *
 * @throws Error if LLM_API_KEY is not set
 */
export function validateConfig(): void {
  if (!process.env.LLM_API_KEY) {
    throw new Error(
      'LLM_API_KEY environment variable is required. ' +
        'Get your API key at https://openrouter.ai/keys ' +
        'and add it to your .env.local file.'
    )
  }

  const baseUrl = process.env.LLM_API_BASE || OPENROUTER_BASE_URL
  if (!baseUrl.startsWith('https://openrouter.ai/api/v1')) {
    console.warn(
      `[OpenRouter] Unexpected LLM_API_BASE: ${baseUrl}. ` +
        `Expected: https://openrouter.ai/api/v1`
    )
  }
}

/**
 * Re-exports for convenience
 */
export { OPENROUTER_BASE_URL as BASE_URL }
export { OPENROUTER_DEFAULT_MODEL as DEFAULT_MODEL }
export { OPENROUTER_MODELS as MODELS }
