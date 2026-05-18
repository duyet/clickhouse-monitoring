/**
 * ClickHouse AI Agent using AI SDK ToolLoopAgent
 *
 * A native AI SDK agent for querying ClickHouse using natural language.
 * Supports multiple LLM providers (OpenRouter, NVIDIA NIM, AnyRouter)
 * via the provider registry.
 */

import 'server-only'

import type { ProviderOptions } from '@ai-sdk/provider-utils'

import { createMcpTools } from './mcp-tool-adapter'
import { CLICKHOUSE_AGENT_INSTRUCTIONS } from './prompts/clickhouse-instructions'
import { DEFAULT_MODEL, resolveAgentChatModel } from './provider-chat-model'
import { stepCountIs, ToolLoopAgent } from 'ai'

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

const DEFAULT_MAX_STEPS = 30

export function createClickHouseAgent(options: {
  /** Model ID in `provider:model` format (e.g., `openrouter:openrouter/free`) */
  model?: string
  maxSteps?: number
  hostId: number
  disabledTools?: string[]
  systemPrompt?: string
  providerOptions?: ProviderOptions
  /** Origin of the calling request — passed as OpenRouter HTTP-Referer. */
  referer?: string
}) {
  const {
    model = DEFAULT_MODEL,
    maxSteps = DEFAULT_MAX_STEPS,
    hostId,
    disabledTools = [],
    systemPrompt = CLICKHOUSE_AGENT_INSTRUCTIONS,
    providerOptions,
    referer,
  } = options

  const allTools = createMcpTools(hostId)
  const tools = filterTools(allTools, disabledTools)
  const hasTools = Object.keys(tools).length > 0
  const { model: modelInstance } = resolveAgentChatModel({
    model,
    hasTools,
    referer,
  })

  return new ToolLoopAgent({
    id: 'clickhouse-agent',
    model: modelInstance,
    tools,
    instructions: systemPrompt,
    stopWhen: stepCountIs(maxSteps),
    ...(providerOptions && { providerOptions }),
  })
}
