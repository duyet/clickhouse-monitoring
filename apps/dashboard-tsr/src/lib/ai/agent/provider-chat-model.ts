/**
 * OpenAI-compatible chat model resolution for agent routes.
 *
 * Keeps provider setup shared between the streaming agent and small
 * one-off generations such as follow-up suggestions.
 */

import type { LanguageModel } from 'ai'

import { resolveDefaultAgentModel } from '../agent-model-registry'
import { parseModelId, resolveProvider } from '../providers'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

export const DEFAULT_MODEL =
  process.env.LLM_MODEL?.trim() || resolveDefaultAgentModel()

export const DEFAULT_APP_REFERER = 'https://chmonitor.dev'
export const DEFAULT_APP_NAME = 'chmonitor'
export const DEFAULT_APP_SOURCE = 'chmonitor'
export const DEFAULT_APP_CATEGORY = 'programming-app'
export const DEFAULT_APP_VERSION = '0.2.0'

function getOpenRouterFreeFallbackModel(): string {
  return (
    process.env.OPENROUTER_FREE_FALLBACK_MODEL?.trim() ||
    'qwen/qwen3-coder:free'
  )
}

function isAnthropicModel(model: string): boolean {
  const lower = model.toLowerCase()
  return (
    lower.startsWith('anthropic/') || /(^|[/_-])claude([/_-]|$)/.test(lower)
  )
}

/**
 * Resolve app attribution metadata from env + defaults.
 * `APP_*` is the canonical name; `OPENROUTER_*` is supported as a fallback
 * so existing deployments that set the older vars keep working.
 */
function getAppMetadata(referer?: string) {
  return {
    referer:
      referer ||
      process.env.APP_REFERER ||
      process.env.OPENROUTER_REFERER ||
      DEFAULT_APP_REFERER,
    name:
      process.env.APP_NAME ||
      process.env.OPENROUTER_APP_NAME ||
      DEFAULT_APP_NAME,
    source: process.env.APP_SOURCE || DEFAULT_APP_SOURCE,
    category: process.env.APP_CATEGORY || DEFAULT_APP_CATEGORY,
    version: process.env.APP_VERSION || DEFAULT_APP_VERSION,
  }
}

function getOpenAICompatibleHeaders(providerId: string, referer?: string) {
  if (providerId !== 'anyrouter') return undefined

  const meta = getAppMetadata(referer)
  // X-AnyRouter-Source is the app identifier AnyRouter groups rankings by (its
  // curation matches this against `chmonitor`); the marketplace category goes in
  // X-AnyRouter-Categories. Keep them separate — sending the category as the
  // source makes AnyRouter attribute usage to `programming-app` instead of
  // chmonitor.dev.
  return {
    'HTTP-Referer': meta.referer,
    'X-AnyRouter-Title': meta.name,
    'X-AnyRouter-Source': meta.source,
    'X-AnyRouter-Categories': meta.category,
    'X-AnyRouter-Version': meta.version,
  }
}

export interface ResolvedAgentChatModel {
  readonly model: LanguageModel
  readonly modelId: string
  readonly providerId: string
}

export function resolveAgentChatModel({
  model = DEFAULT_MODEL,
  hasTools = false,
  referer,
}: {
  readonly model?: string
  readonly hasTools?: boolean
  readonly referer?: string
}): ResolvedAgentChatModel {
  const resolved = resolveProvider(model)
  const { model: modelId } = parseModelId(model)

  if (resolved.isOpenRouter) {
    const meta = getAppMetadata(referer)
    const openrouter = createOpenRouter({
      apiKey: resolved.apiKey,
      headers: {
        'HTTP-Referer': meta.referer,
        'X-OpenRouter-Title': meta.name,
        'X-OpenRouter-Categories': meta.category,
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
      console.debug(
        `[Agent] Prompt caching enabled for Anthropic model: ${resolvedModelId}`
      )
    }

    return {
      model: openrouter.chat(resolvedModelId, {
        ...(hasTools && { provider: { require_parameters: true } }),
        ...(usePromptCache && { cache_control: { type: 'ephemeral' } }),
      }) as LanguageModel,
      modelId: resolvedModelId,
      providerId: resolved.providerId,
    }
  }

  const headers = getOpenAICompatibleHeaders(resolved.providerId, referer)
  const openai = createOpenAI({
    apiKey: resolved.apiKey,
    baseURL: resolved.baseURL,
    ...(headers && { headers }),
  })

  return {
    model: openai.chat(modelId) as LanguageModel,
    modelId,
    providerId: resolved.providerId,
  }
}
