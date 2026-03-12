/**
 * ClickHouse AI Agent using AI SDK ToolLoopAgent
 *
 * A native AI SDK agent for querying ClickHouse using natural language.
 * Replaces the LangGraph-based agent with simpler, more efficient architecture.
 */

import { createMcpTools } from './mcp-tool-adapter'
import { CLICKHOUSE_AGENT_INSTRUCTIONS } from './prompts/clickhouse-instructions'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { stepCountIs, ToolLoopAgent } from 'ai'

/**
 * Default model configuration
 * Falls back to stepfun/step-3.5-flash:free if LLM_MODEL env var is not set
 */
const DEFAULT_MODEL = process.env.LLM_MODEL || 'stepfun/step-3.5-flash:free'
const DEFAULT_MAX_STEPS = 30

/**
 * Create a ClickHouse agent with the specified model and configuration
 */
export function createClickHouseAgent(options: {
  /**
   * The model to use for the agent (e.g., 'openrouter/free')
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
}) {
  const {
    model = DEFAULT_MODEL,
    apiKey,
    baseURL,
    maxSteps = DEFAULT_MAX_STEPS,
    hostId,
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
  const provider = isOpenRouter
    ? createOpenRouter({
        apiKey: apiKeyValue,
        headers: {
          ...(openRouterReferer && { 'HTTP-Referer': openRouterReferer }),
          ...(openRouterAppName && { 'X-OpenRouter-Title': openRouterAppName }),
        },
      })
    : createOpenAI({
        apiKey: apiKeyValue,
        baseURL: apiBaseURL,
      })

  // Get the model instance
  // For OpenRouter, strip the 'openrouter/' prefix if present (provider handles it)
  const modelId =
    isOpenRouter && model.startsWith('openrouter/')
      ? model.replace('openrouter/', '')
      : model
  const modelInstance = provider(modelId)

  // Get tools for this host
  const tools = createMcpTools(hostId)

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
