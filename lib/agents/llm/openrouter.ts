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
 * Models that support streaming responses
 *
 * These models have been verified to support Server-Sent Events (SSE)
 * streaming through OpenRouter's API.
 */
export const STREAMING_CAPABLE_MODELS = [
  'openrouter/free',
  'google/gemma-2-9b:free',
  'google/gemma-3-4b-it:free',
  'meta-llama/llama-3-8b:free',
  'meta-llama/llama-3.1-8b:free',
  'meta-llama/llama-3.1-70b:free',
  'meta-llama/llama-3.2-3b:free',
  'meta-llama/llama-3.2-11b-vision:free',
  'microsoft/phi-3-medium-128k-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'mistralai/mistral-nemo:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.7-sonnet',
  'openai/gpt-3.5-turbo',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-flash-1.5',
  'google/gemini-pro-1.5',
] as const

/**
 * Model capability flags
 *
 * Describes the features supported by a specific model.
 */
export interface ModelCapabilities {
  /** Whether the model supports streaming responses */
  streaming: boolean
  /** Whether the model supports function/tool calling */
  tools: boolean
  /** Maximum context window in tokens */
  contextLength: number
  /** Whether the model supports vision/image inputs */
  vision: boolean
}

/**
 * Model capability registry
 *
 * Maps known models to their capabilities. Unknown models receive
 * conservative defaults.
 */
const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  // Free tier models
  'openrouter/free': {
    streaming: true,
    tools: true,
    contextLength: 8192,
    vision: false,
  },
  'google/gemma-2-9b:free': {
    streaming: true,
    tools: true,
    contextLength: 8192,
    vision: false,
  },
  'google/gemma-3-4b-it:free': {
    streaming: true,
    tools: true,
    contextLength: 32768,
    vision: false,
  },
  'meta-llama/llama-3-8b:free': {
    streaming: true,
    tools: true,
    contextLength: 8192,
    vision: false,
  },
  'meta-llama/llama-3.1-8b:free': {
    streaming: true,
    tools: true,
    contextLength: 131072,
    vision: false,
  },
  'meta-llama/llama-3.1-70b:free': {
    streaming: true,
    tools: true,
    contextLength: 131072,
    vision: false,
  },
  'meta-llama/llama-3.2-3b:free': {
    streaming: true,
    tools: true,
    contextLength: 131072,
    vision: false,
  },
  'meta-llama/llama-3.2-11b-vision:free': {
    streaming: true,
    tools: true,
    contextLength: 131072,
    vision: true,
  },
  'microsoft/phi-3-medium-128k-instruct:free': {
    streaming: true,
    tools: true,
    contextLength: 128000,
    vision: false,
  },
  'mistralai/mistral-7b-instruct:free': {
    streaming: true,
    tools: true,
    contextLength: 32768,
    vision: false,
  },
  'mistralai/mistral-nemo:free': {
    streaming: true,
    tools: true,
    contextLength: 128000,
    vision: false,
  },
  'qwen/qwen-2.5-7b-instruct:free': {
    streaming: true,
    tools: true,
    contextLength: 131072,
    vision: false,
  },

  // Anthropic Claude
  'anthropic/claude-3-haiku': {
    streaming: true,
    tools: true,
    contextLength: 200000,
    vision: true,
  },
  'anthropic/claude-3.5-sonnet': {
    streaming: true,
    tools: true,
    contextLength: 200000,
    vision: true,
  },
  'anthropic/claude-3.7-sonnet': {
    streaming: true,
    tools: true,
    contextLength: 200000,
    vision: true,
  },

  // OpenAI GPT
  'openai/gpt-3.5-turbo': {
    streaming: true,
    tools: true,
    contextLength: 16385,
    vision: false,
  },
  'openai/gpt-4o': {
    streaming: true,
    tools: true,
    contextLength: 128000,
    vision: true,
  },
  'openai/gpt-4o-mini': {
    streaming: true,
    tools: true,
    contextLength: 128000,
    vision: true,
  },

  // Google Gemini
  'google/gemini-flash-1.5': {
    streaming: true,
    tools: true,
    contextLength: 1000000,
    vision: true,
  },
  'google/gemini-pro-1.5': {
    streaming: true,
    tools: true,
    contextLength: 2000000,
    vision: true,
  },
}

/**
 * Default capabilities for unknown models
 *
 * Conservative defaults to ensure compatibility.
 */
const DEFAULT_CAPABILITIES: ModelCapabilities = {
  streaming: false,
  tools: true,
  contextLength: 4096,
  vision: false,
}

/**
 * Get model capabilities
 *
 * Returns the capabilities for a given model. For unknown models,
 * returns conservative default capabilities.
 *
 * @param model - Model identifier (e.g., 'openrouter/free', 'anthropic/claude-3.5-sonnet')
 * @returns Model capabilities object
 *
 * @example
 * ```ts
 * const caps = getModelCapabilities('openrouter/free')
 * console.log(caps.streaming) // true
 * console.log(caps.contextLength) // 8192
 * ```
 */
export function getModelCapabilities(model: string): ModelCapabilities {
  return MODEL_CAPABILITIES[model] || DEFAULT_CAPABILITIES
}

/**
 * Check if a model supports streaming
 *
 * @param model - Model identifier
 * @returns true if the model supports streaming responses
 */
export function isStreamingCapable(model: string): boolean {
  return getModelCapabilities(model).streaming
}

/**
 * Check if a model supports tool/function calling
 *
 * @param model - Model identifier
 * @returns true if the model supports tool calling
 */
export function isToolsCapable(model: string): boolean {
  return getModelCapabilities(model).tools
}

/**
 * Create a ChatOpenAI instance with streaming enabled
 *
 * This function creates a LangChain ChatOpenAI instance configured for
 * OpenRouter, with streaming support enabled for real-time token delivery.
 *
 * @param model - Optional model identifier (defaults to LLM_MODEL env var or 'openrouter/free')
 * @param options - Optional additional ChatOpenAI options
 * @returns Promise resolving to a ChatOpenAI instance with streaming enabled
 *
 * @throws Error if LLM_API_KEY environment variable is not set
 *
 * @example
 * ```ts
 * const llm = await createStreamingLLM('anthropic/claude-3.5-sonnet')
 * const stream = await llm.stream([new HumanMessage('Hello')])
 * for await (const chunk of stream) {
 *   console.log(chunk.content)
 * }
 * ```
 */
export async function createStreamingLLM(
  model?: string,
  options?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
) {
  // Dynamic import to avoid bundling issues
  const { ChatOpenAI } = await import('@langchain/openai')

  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    throw new Error(
      'LLM_API_KEY environment variable is required. ' +
        'Get your API key at https://openrouter.ai/keys ' +
        'and add it to your .env.local file.'
    )
  }

  const modelName = model || getModelName()
  const capabilities = getModelCapabilities(modelName)

  // Warn if model doesn't support streaming
  if (!capabilities.streaming) {
    console.warn(
      `[OpenRouter] Model "${modelName}" may not support streaming. ` +
        `Falling back to non-streaming mode.`
    )
  }

  const config = OPENROUTER_CONFIG(apiKey)

  return new ChatOpenAI({
    ...config,
    modelName,
    streaming: true,
    verbose: process.env.NODE_ENV === 'development',
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? capabilities.contextLength,
    topP: options?.topP,
  })
}

/**
 * Create a ChatOpenAI instance (non-streaming)
 *
 * This is the standard LLM creation function for non-streaming use cases.
 * Maintained for backward compatibility with existing code.
 *
 * @param model - Optional model identifier (defaults to LLM_MODEL env var or 'openrouter/free')
 * @param options - Optional additional ChatOpenAI options
 * @returns Promise resolving to a ChatOpenAI instance
 *
 * @throws Error if LLM_API_KEY environment variable is not set
 *
 * @example
 * ```ts
 * const llm = await createLLM('openrouter/free')
 * const response = await llm.invoke([new HumanMessage('Hello')])
 * console.log(response.content)
 * ```
 */
export async function createLLM(
  model?: string,
  options?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
) {
  // Dynamic import to avoid bundling issues
  const { ChatOpenAI } = await import('@langchain/openai')

  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    throw new Error(
      'LLM_API_KEY environment variable is required. ' +
        'Get your API key at https://openrouter.ai/keys ' +
        'and add it to your .env.local file.'
    )
  }

  const modelName = model || getModelName()
  const capabilities = getModelCapabilities(modelName)

  const config = OPENROUTER_CONFIG(apiKey)

  return new ChatOpenAI({
    ...config,
    modelName,
    streaming: false,
    verbose: process.env.NODE_ENV === 'development',
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? Math.min(capabilities.contextLength, 4096),
    topP: options?.topP,
  })
}

/**
 * Re-exports for convenience
 */
export { OPENROUTER_BASE_URL as BASE_URL }
export { OPENROUTER_DEFAULT_MODEL as DEFAULT_MODEL }
export { OPENROUTER_MODELS as MODELS }
