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
 */
const DEFAULT_MODEL = 'stepfun/step-3.5-flash:free'
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

  // Create OpenAI provider
  const openai = createOpenAI({
    apiKey: apiKey || process.env.LLM_API_KEY,
    baseURL: baseURL || process.env.LLM_API_BASE,
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
