/**
 * ClickHouse AI Agent using AI SDK ToolLoopAgent
 *
 * A native AI SDK agent for querying ClickHouse using natural language.
 * Replaces the LangGraph-based agent with simpler, more efficient architecture.
 */

import { createMcpTools } from './mcp-tool-adapter'
import { CLICKHOUSE_AGENT_INSTRUCTIONS } from './prompts/clickhouse-instructions'
import { createOpenAI } from '@ai-sdk/openai'
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

  // Detect if using OpenRouter by checking the baseURL
  const isOpenRouter = (baseURL || process.env.LLM_API_BASE || '').includes(
    'openrouter'
  )

  // Create OpenAI provider with optional OpenRouter headers
  const openai = createOpenAI({
    apiKey: apiKey || process.env.LLM_API_KEY,
    baseURL: baseURL || process.env.LLM_API_BASE,
    ...(isOpenRouter && {
      headers: {
        'HTTP-Referer': 'https://clickhouse.duyet.net',
        'X-OpenRouter-Title': 'ClickHouse Monitoring',
      },
    }),
  })

  // Get the model instance
  const modelInstance = openai(model)

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
