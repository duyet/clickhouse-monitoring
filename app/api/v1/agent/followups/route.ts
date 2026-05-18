/**
 * Agent follow-up suggestion endpoint.
 *
 * Generates short, context-aware questions after the main assistant response.
 * This route is intentionally separate from the streaming answer path so
 * failures never hide a completed answer.
 */

import { z } from 'zod'

import type { UIMessage } from 'ai'

import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { classifyError } from '@/lib/ai/agent/errors'
import {
  DEFAULT_MODEL,
  resolveAgentChatModel,
} from '@/lib/ai/agent/provider-chat-model'
import {
  getProviderName,
  isProviderConfigured,
  parseModelId,
} from '@/lib/ai/providers'
import { authorizeAgentApiRequest } from '@/lib/auth/agent-api-auth'

export const dynamic = 'force-dynamic'

const MAX_MESSAGES = 12
const MAX_TEXT_CHARS = 1_200
const MAX_PROMPT_CHARS = 9_000

const FollowupsOutputSchema = z.object({
  suggestions: z
    .array(
      z
        .string()
        .trim()
        .min(8)
        .max(120)
        .describe('A short ClickHouse monitoring follow-up question.')
    )
    .min(2)
    .max(3),
})

type FollowupsRequestBody = {
  readonly messages?: UIMessage[]
  readonly model?: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function clampText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  return `${value.slice(0, maxChars - 3)}...`
}

function getTextFromPart(part: unknown): string | null {
  if (!isObject(part) || typeof part.type !== 'string') return null
  if (part.type === 'text' && typeof part.text === 'string') {
    return part.text
  }
  if (part.type === 'reasoning' && typeof part.text === 'string') {
    return `Reasoning: ${part.text}`
  }
  if (part.type === 'data-usage') {
    return null
  }
  if (part.type === 'dynamic-tool') {
    const toolName = typeof part.toolName === 'string' ? part.toolName : 'tool'
    return `Tool call: ${toolName}`
  }
  if (part.type.startsWith('tool-')) {
    return `Tool call: ${part.type.replace(/^tool-/, '')}`
  }
  return null
}

function buildConversationContext(messages: readonly UIMessage[]): string {
  const lines = messages
    .slice(-MAX_MESSAGES)
    .map((message) => {
      const text = message.parts
        .map(getTextFromPart)
        .filter((part): part is string => Boolean(part))
        .join('\n')
        .trim()

      if (!text) return null

      return `${message.role}: ${clampText(text, MAX_TEXT_CHARS)}`
    })
    .filter((line): line is string => Boolean(line))

  return clampText(lines.join('\n\n'), MAX_PROMPT_CHARS)
}

function normalizeSuggestions(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const suggestions: string[] = []

  for (const value of values) {
    const text = value.replace(/\s+/g, ' ').trim()
    const key = text.toLowerCase()
    if (!text || seen.has(key)) continue

    seen.add(key)
    suggestions.push(text)
    if (suggestions.length === 3) break
  }

  return suggestions
}

export async function POST(request: Request) {
  const authResponse = await authorizeAgentApiRequest(request)
  if (authResponse) return authResponse

  let body: FollowupsRequestBody
  try {
    const parsed = await request.json()
    body = isObject(parsed) ? (parsed as FollowupsRequestBody) : {}
  } catch (_error) {
    return NextResponse.json(
      {
        error: {
          message: 'Invalid JSON payload',
          code: 'INVALID_JSON',
        },
      },
      { status: 400 }
    )
  }

  const model =
    typeof body.model === 'string' && body.model.trim().length > 0
      ? body.model
      : DEFAULT_MODEL
  const { provider: requestedProvider } = parseModelId(model)

  if (!isProviderConfigured(requestedProvider)) {
    const classified = classifyError(
      {
        statusCode: 503,
        error: {
          code: 'provider_not_configured',
          message: `Provider "${getProviderName(requestedProvider)}" is not configured on this deployment.`,
        },
      },
      { model, provider: requestedProvider }
    )

    return NextResponse.json({ error: classified }, { status: 503 })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const context = buildConversationContext(messages)

  if (!context) {
    return NextResponse.json({ suggestions: [] })
  }

  const { model: modelInstance, providerId } = resolveAgentChatModel({
    model,
    hasTools: false,
    referer: request.headers.get('origin') ?? undefined,
  })

  try {
    const result = await generateText({
      model: modelInstance,
      system:
        'Generate concise ClickHouse monitoring follow-up questions. Return only useful next questions a database operator would click. Do not include markdown, numbering, or explanations.',
      prompt: `Conversation context:\n${context}\n\nReturn 2 or 3 short follow-up questions that naturally continue this investigation.`,
      output: Output.object({
        schema: FollowupsOutputSchema,
      }),
    })

    const suggestions = normalizeSuggestions(result.output.suggestions)
    if (suggestions.length < 2) {
      throw new Error('Follow-up generation returned too few suggestions.')
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    const classified = classifyError(error, { model, provider: providerId })
    console.error('[Agent Followups API] Classified error:', classified)
    return NextResponse.json(
      {
        error: classified,
      },
      { status: classified.statusCode ?? 502 }
    )
  }
}
