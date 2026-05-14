/**
 * ClickHouse AI Agent using AI SDK ToolLoopAgent
 *
 * A native AI SDK agent for querying ClickHouse using natural language.
 * Supports multiple LLM providers (OpenRouter, NVIDIA NIM, AnyRouter)
 * via the provider registry.
 */

import 'server-only'

import type { ProviderOptions } from '@ai-sdk/provider-utils'

import { parseModelId, resolveProvider } from '../providers'
import { createMcpTools } from './mcp-tool-adapter'
import { CLICKHOUSE_AGENT_INSTRUCTIONS } from './prompts/clickhouse-instructions'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
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

const DEFAULT_MODEL = process.env.LLM_MODEL || 'openrouter:openrouter/auto'

function getOpenRouterFreeFallbackModel(): string {
  return process.env.OPENROUTER_FREE_FALLBACK_MODEL || 'qwen/qwen3-coder:free'
}

function isAnthropicModel(model: string): boolean {
  return (
    model.startsWith('anthropic/') || model.toLowerCase().includes('claude')
  )
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
}) {
  const {
    model = DEFAULT_MODEL,
    maxSteps = DEFAULT_MAX_STEPS,
    hostId,
    disabledTools = [],
    systemPrompt = CLICKHOUSE_AGENT_INSTRUCTIONS,
    providerOptions,
  } = options

  const resolved = resolveProvider(model)
  const { model: modelId } = parseModelId(model)

  const allTools = createMcpTools(hostId)
  const tools = filterTools(allTools, disabledTools)
  const hasTools = Object.keys(tools).length > 0

  if (resolved.isOpenRouter) {
    return createOpenRouterAgent({
      resolved,
      modelId,
      tools,
      hasTools,
      systemPrompt,
      maxSteps,
      providerOptions,
    })
  }

  return createOpenAIAgent({
    resolved,
    modelId,
    tools,
    systemPrompt,
    maxSteps,
  })
}

type ToolSet = ReturnType<typeof createMcpTools>

function createOpenRouterAgent(opts: {
  resolved: ReturnType<typeof resolveProvider>
  modelId: string
  tools: ToolSet
  hasTools: boolean
  systemPrompt: string
  maxSteps: number
  providerOptions?: ProviderOptions
}) {
  const {
    resolved,
    modelId,
    tools,
    hasTools,
    systemPrompt,
    maxSteps,
    providerOptions,
  } = opts

  const openRouterReferer = process.env.OPENROUTER_REFERER
  const openRouterAppName = process.env.OPENROUTER_APP_NAME

  const openrouter = createOpenRouter({
    apiKey: resolved.apiKey,
    headers: {
      ...(openRouterReferer && { 'HTTP-Referer': openRouterReferer }),
      ...(openRouterAppName && {
        'X-OpenRouter-Title': openRouterAppName,
      }),
    },
  })

  // Strip 'openrouter/' prefix for OpenRouter's chat model resolution.
  // Map `openrouter/free` to a concrete free tool-capable model.
  const normalizedModelId = modelId.startsWith('openrouter/')
    ? modelId.replace('openrouter/', '')
    : modelId
  const resolvedModelId =
    normalizedModelId === 'free'
      ? getOpenRouterFreeFallbackModel()
      : normalizedModelId
  if (normalizedModelId === 'free') {
    console.warn(
      `[Agent] openrouter/free resolved to fallback: ${resolvedModelId}`
    )
  }

  const usePromptCache = isAnthropicModel(resolvedModelId)
  if (usePromptCache) {
    console.log(
      `[Agent] Prompt caching enabled for Anthropic model: ${resolvedModelId}`
    )
  }

  const modelInstance = openrouter.chat(resolvedModelId, {
    ...(hasTools && { provider: { require_parameters: true } }),
    ...(usePromptCache && { cache_control: { type: 'ephemeral' } }),
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

function createOpenAIAgent(opts: {
  resolved: ReturnType<typeof resolveProvider>
  modelId: string
  tools: ToolSet
  systemPrompt: string
  maxSteps: number
}) {
  const { resolved, modelId, tools, systemPrompt, maxSteps } = opts

  const openai = createOpenAI({
    apiKey: resolved.apiKey,
    baseURL: resolved.baseURL,
    name: resolved.providerId,
  })

  return new ToolLoopAgent({
    id: 'clickhouse-agent',
    model: openai.chat(modelId),
    tools,
    instructions: systemPrompt,
    stopWhen: stepCountIs(maxSteps),
  })
}
