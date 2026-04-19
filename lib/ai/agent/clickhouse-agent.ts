/**
 * ClickHouse AI Agent using AI SDK ToolLoopAgent
 *
 * A native AI SDK agent for querying ClickHouse using natural language.
 * Replaces the LangGraph-based agent with simpler, more efficient architecture.
 */

import 'server-only'

import { createMcpTools } from './mcp-tool-adapter'
import { CLICKHOUSE_AGENT_INSTRUCTIONS } from './prompts/clickhouse-instructions'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { stepCountIs, ToolLoopAgent } from 'ai'

/**
 * Filter a tools record to exclude disabled tool names.
 */
function filterTools<T extends Record<string, unknown>>(
  tools: T,
  disabledTools: string[]
): T {
  if (disabledTools.length === 0) return tools
  const filtered = { ...tools }
  for (const name of disabledTools) {
    delete filtered[name as keyof T]
  }
  return filtered
}

/**
 * Default model configuration
 * Falls back to openrouter/free if LLM_MODEL env var is not set
 */
const DEFAULT_MODEL = process.env.LLM_MODEL || 'openrouter/free'

/**
 * Returns true for Anthropic/Claude models routed via OpenRouter.
 * Matches both the 'anthropic/' provider prefix and bare 'claude-*' names.
 */
function isAnthropicModel(model: string): boolean {
  return (
    model.startsWith('anthropic/') || model.toLowerCase().includes('claude')
  )
}

const DEFAULT_MAX_STEPS = 30

/**
 * Create a ClickHouse agent with the specified model and configuration
 */
export function createClickHouseAgent(options: {
  /**
   * The model to use for the agent (e.g., 'openrouter/free')
   * Defaults to 'openrouter/free' which auto-routes to a working free tool-capable model.
   */
  model?: string

  /**
   * LLM API key (falls back to LLM_API_KEY env var)
   */
  apiKey?: string

  /**
   * Base URL for LLM API (for custom endpoints like OpenRouter)
   */
  baseURL?: string

  /**
   * Maximum number of tool execution steps
   */
  maxSteps?: number

  /**
   * ClickHouse host ID to query
   */
  hostId: number

  /**
   * Tool names that the user has disabled in the UI.
   * These tools will be excluded from the agent's tool set.
   */
  disabledTools?: string[]
}) {
  const {
    model = DEFAULT_MODEL,
    apiKey,
    baseURL,
    maxSteps = DEFAULT_MAX_STEPS,
    hostId,
    disabledTools = [],
  } = options

  // Detect if using OpenRouter by checking the baseURL or model name
  const isOpenRouter =
    (baseURL || process.env.LLM_API_BASE || '').includes('openrouter') ||
    model.startsWith('openrouter/')

  // OpenRouter identification headers for rankings/analytics
  // Configurable via OPENROUTER_REFERER and OPENROUTER_APP_NAME env vars
  const openRouterReferer = process.env.OPENROUTER_REFERER
  const openRouterAppName = process.env.OPENROUTER_APP_NAME

  // Get the base URL and API key
  const apiBaseURL = baseURL || process.env.LLM_API_BASE
  const apiKeyValue = apiKey || process.env.LLM_API_KEY

  // Create the appropriate provider based on detection
  // Use dedicated OpenRouter provider to avoid Responses API issues
  if (isOpenRouter) {
    const openrouter = createOpenRouter({
      apiKey: apiKeyValue,
      headers: {
        ...(openRouterReferer && { 'HTTP-Referer': openRouterReferer }),
        ...(openRouterAppName && { 'X-OpenRouter-Title': openRouterAppName }),
      },
    })

    // For OpenRouter, use .chat() method and strip 'openrouter/' prefix if present
    const modelId = model.startsWith('openrouter/')
      ? model.replace('openrouter/', '')
      : model

    // Prompt caching: static system instructions (~400 tokens) are ideal cache
    // candidates. Only Anthropic models support this via OpenRouter's cache_control.
    const usePromptCache = isAnthropicModel(modelId)
    if (usePromptCache) {
      console.log(
        `[Agent] Prompt caching enabled for Anthropic model: ${modelId}`
      )
    }
    const modelInstance = openrouter.chat(
      modelId,
      usePromptCache ? { cache_control: { type: 'ephemeral' } } : undefined
    )

    // Get tools for this host, filtering out disabled tools
    const allTools = createMcpTools(hostId)
    const tools = filterTools(allTools, disabledTools)

    // Create the agent
    const agent = new ToolLoopAgent({
      id: 'clickhouse-agent',
      model: modelInstance,
      tools,
      instructions: CLICKHOUSE_AGENT_INSTRUCTIONS,
      stopWhen: stepCountIs(maxSteps),
    })

    return agent
  }

  // For OpenAI-compatible providers (including Azure OpenAI)
  const openai = createOpenAI({
    apiKey: apiKeyValue,
    baseURL: apiBaseURL,
  })
  const modelInstance = openai.chat(model)

  // Get tools for this host, filtering out disabled tools
  const allTools = createMcpTools(hostId)
  const tools = filterTools(allTools, disabledTools)

  // Create the agent
  const agent = new ToolLoopAgent({
    id: 'clickhouse-agent',
    model: modelInstance,
    tools,
    instructions: CLICKHOUSE_AGENT_INSTRUCTIONS,
    stopWhen: stepCountIs(maxSteps),
  })

  return agent
}
