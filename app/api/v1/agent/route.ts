/**
 * AI Agent API Endpoint (Streaming)
 *
 * POST /api/v1/agent
 *
 * Processes natural language queries through the AI SDK ToolLoopAgent
 * and streams results back using the Vercel AI SDK's UI Message Stream format.
 * This enables the frontend `useChat` hook to consume events in real-time,
 * including tool call rendering.
 *
 * Replaces the LangGraph-based agent with native AI SDK ToolLoopAgent.
 */

import type { LanguageModelUsage } from 'ai'

import { pipeJsonRender } from '@json-render/core'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type ModelMessage,
  type UIDataTypes,
  type UIMessage,
  type UITools,
} from 'ai'
import { createClickHouseAgent } from '@/lib/ai/agent'
import { aggregateUsageWithCost } from '@/lib/ai/agent/analytics'
import { classifyError } from '@/lib/ai/agent/errors'
import { AGENT_JSON_RENDER_INLINE_PROMPT } from '@/lib/ai/agent/json-render-inline-prompt'
import { createJsonRenderPatchGuardStream } from '@/lib/ai/agent/json-render-patch-guard'
import { authorizeAgentApiRequest } from '@/lib/auth/agent-api-auth'
import { isClerkAuthProvider } from '@/lib/auth/provider'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const AGENT_DEBUG_LOGS = process.env.NODE_ENV !== 'production'

const AGENT_MAX_REQUEST_SIZE_BYTES = 128 * 1024
const AGENT_STREAM_TIMEOUT_MS = 30_000
const AGENT_STREAM_STEP_TIMEOUT_MS = 12_000
const AGENT_MAX_MESSAGES = 64
const AGENT_MAX_MESSAGE_PARTS = 64
const AGENT_MAX_USER_MESSAGE_LENGTH = 8_192
const AGENT_MAX_PART_TEXT_LENGTH = 2_048
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

type AgentRequestBody = {
  message?: string
  messages?: Array<
    | { id: string; role: string; parts: Array<unknown> }
    | { role: string; content: string; parts?: unknown[] }
  >
  hostId?: number
  model?: string
  disabledTools?: string[]
  sessionId?: string
}

type SanitizeIncomingMessagesResult =
  | {
      readonly ok: true
      readonly messages: ReadonlyArray<SafeAgentMessage>
    }
  | {
      readonly ok: false
      readonly reason: 'too_many_messages'
    }

type SafeAgentMessage = {
  readonly id: string
  readonly role: 'system' | 'user' | 'assistant'
  readonly parts: Array<{
    [key: string]: unknown
    type: string
  }>
  readonly content?: string
}

/**
 * Check whether a value is an object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Truncate text to a safe UTF-8 byte length.
 */
function clampText(value: string, maxBytes: number): string {
  const encoded = textEncoder.encode(value)
  if (encoded.length <= maxBytes) {
    return value
  }

  let end = maxBytes
  while (
    end > 0 &&
    end < encoded.length &&
    (encoded[end] & 0b1100_0000) === 0b1000_0000
  ) {
    end -= 1
  }

  return textDecoder.decode(encoded.slice(0, end))
}

async function readRequestBodyTextWithLimit(
  request: Request,
  maxBytes: number
): Promise<{ text: string; byteLength: number } | null> {
  const bodyStream = request.body
  if (!bodyStream) {
    return { text: '', byteLength: 0 }
  }

  const reader = bodyStream.getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []
  let byteLength = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      byteLength += value.length
      if (byteLength > maxBytes) {
        try {
          await reader.cancel()
        } catch (_error) {
          // Ignore cancellation errors if the stream is already closed.
        }
        return null
      }

      chunks.push(decoder.decode(value, { stream: true }))
    }
  } finally {
    reader.releaseLock()
  }

  chunks.push(decoder.decode())
  return { text: chunks.join(''), byteLength }
}

/**
 * Sanitize one message part.
 */
function sanitizeMessagePart(part: unknown): {
  [key: string]: unknown
  type: string
} | null {
  if (!isObject(part) || typeof part.type !== 'string') {
    return null
  }

  const safePart: { [key: string]: unknown; type: string } = {
    ...part,
    type: part.type,
  }

  if (part.type === 'text' && typeof part.text === 'string') {
    safePart.text = clampText(part.text, AGENT_MAX_PART_TEXT_LENGTH)
  }

  return safePart
}

/**
 * Map model roles into the accepted role set.
 */
function normalizeRole(role: string): 'system' | 'user' | 'assistant' {
  if (role === 'assistant' || role === 'system') return role
  return 'user'
}

/**
 * Sanitize raw user messages into the safe internal message shape.
 *
 * - Cap total messages at `AGENT_MAX_MESSAGES`.
 * - Cap per-message parts at `AGENT_MAX_MESSAGE_PARTS`.
 * - Clamp text fields to configured byte limits.
 * - Drops malformed/empty messages.
 */
function sanitizeIncomingMessages(
  messages: unknown[] | undefined
): SanitizeIncomingMessagesResult {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: true, messages: [] }
  }

  if (messages.length > AGENT_MAX_MESSAGES) {
    return { ok: false, reason: 'too_many_messages' }
  }

  const sanitizedMessages = messages
    .map((msg): SafeAgentMessage | null => {
      if (!isObject(msg) || typeof msg.role !== 'string') {
        return null
      }

      const role = normalizeRole(msg.role)
      const parts = Array.isArray(msg.parts)
        ? msg.parts
            .slice(0, AGENT_MAX_MESSAGE_PARTS)
            .map(sanitizeMessagePart)
            .filter(
              (part): part is { type: string; [key: string]: unknown } =>
                part !== null
            )
        : []

      const contentRaw = msg.content
      const content =
        typeof contentRaw === 'string'
          ? clampText(contentRaw, AGENT_MAX_USER_MESSAGE_LENGTH)
          : null

      if (parts.length === 0 && !content) {
        return null
      }

      return {
        id: typeof msg.id === 'string' ? msg.id : crypto.randomUUID(),
        role,
        parts,
        content: content ?? undefined,
      }
    })
    .filter((value): value is SafeAgentMessage => value !== null)

  return { ok: true, messages: sanitizedMessages }
}

/**
 * Handle POST requests for agent processing with streaming
 */
export async function POST(request: Request) {
  const authResponse = await authorizeAgentApiRequest(request)
  if (authResponse) return authResponse

  const contentLengthHeader = request.headers.get('content-length')
  if (contentLengthHeader) {
    const declaredSize = Number(contentLengthHeader)
    if (
      !Number.isNaN(declaredSize) &&
      declaredSize > AGENT_MAX_REQUEST_SIZE_BYTES
    ) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Request payload too large',
            limitBytes: AGENT_MAX_REQUEST_SIZE_BYTES,
          },
        }),
        { status: 413, headers: { 'content-type': 'application/json' } }
      )
    }
  }

  const requestBodyResult = await readRequestBodyTextWithLimit(
    request,
    AGENT_MAX_REQUEST_SIZE_BYTES
  )
  if (requestBodyResult === null) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Request payload too large',
          limitBytes: AGENT_MAX_REQUEST_SIZE_BYTES,
        },
      }),
      { status: 413, headers: { 'content-type': 'application/json' } }
    )
  }

  let body: AgentRequestBody
  try {
    const parsedBody = JSON.parse(requestBodyResult.text)
    if (
      !isObject(parsedBody) ||
      Array.isArray(parsedBody) ||
      parsedBody === null
    ) {
      throw new Error('INVALID_PAYLOAD')
    }

    body = parsedBody
  } catch (_error) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Invalid JSON payload',
          code: 'INVALID_JSON',
        },
      }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    )
  }

  if (AGENT_DEBUG_LOGS) {
    console.log('[Agent API] Request body keys:', Object.keys(body))
    console.log('[Agent API] Messages count:', body.messages?.length)
  }

  const safeIncomingMessagesResult = sanitizeIncomingMessages(body.messages)

  if (!safeIncomingMessagesResult.ok) {
    return new Response(
      JSON.stringify({
        error: {
          message: `Too many messages. Maximum is ${AGENT_MAX_MESSAGES}.`,
          maxMessages: AGENT_MAX_MESSAGES,
        },
      }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    )
  }

  const safeIncomingMessages = safeIncomingMessagesResult.messages

  if (
    Array.isArray(body.messages) &&
    body.messages.length > 0 &&
    safeIncomingMessages.length === 0 &&
    typeof body.message !== 'string'
  ) {
    return new Response(
      JSON.stringify({
        error: { message: 'No valid messages were provided.' },
      }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    )
  }

  const lastUserMessage = safeIncomingMessages
    .filter((m) => m.role === 'user')
    ?.pop()

  const textPart = lastUserMessage?.parts?.find(
    (p): p is { type: 'text'; text: string } =>
      typeof p === 'object' &&
      p !== null &&
      'type' in p &&
      p.type === 'text' &&
      'text' in p &&
      typeof p.text === 'string' &&
      p.text.trim().length > 0
  )

  const userMessage =
    (typeof body.message === 'string'
      ? clampText(body.message, AGENT_MAX_USER_MESSAGE_LENGTH)
      : undefined) ||
    textPart?.text ||
    lastUserMessage?.content

  const hasNonTextParts =
    Array.isArray(lastUserMessage?.parts) &&
    lastUserMessage.parts.length > 0 &&
    !textPart

  if (
    !hasNonTextParts &&
    (typeof userMessage !== 'string' || !userMessage.trim())
  ) {
    return new Response(
      JSON.stringify({
        error: { message: 'Message is required and must be a string' },
      }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    )
  }

  const hostId =
    typeof body.hostId === 'number' && Number.isFinite(body.hostId)
      ? Math.max(0, Math.trunc(body.hostId))
      : 0
  const model =
    typeof body.model === 'string' && body.model.trim().length > 0
      ? body.model
      : process.env.LLM_MODEL || 'openrouter:openrouter/auto'
  const disabledTools = Array.isArray(body.disabledTools)
    ? body.disabledTools.filter((t) => typeof t === 'string')
    : []
  const sessionId =
    typeof body.sessionId === 'string' && body.sessionId.length > 0
      ? body.sessionId
      : crypto.randomUUID()

  // Resolve user ID for OpenRouter user tracking
  let userId = 'guest'
  if (isClerkAuthProvider()) {
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = await auth()
      if (authResult?.userId) userId = authResult.userId
    } catch {
      // Clerk session unavailable
    }
  }
  const openRouterUser = `${userId}/${sessionId}`

  if (AGENT_DEBUG_LOGS) {
    console.log('[Agent API] OpenRouter user:', openRouterUser)
  }

  const agent = createClickHouseAgent({
    hostId,
    model,
    disabledTools,
    systemPrompt: AGENT_JSON_RENDER_INLINE_PROMPT,
    providerOptions: { openrouter: { user: openRouterUser } },
  })

  const uiMessages: Array<{
    id: string
    role: 'user' | 'system' | 'assistant'
    parts: Array<unknown>
  }> = []

  if (safeIncomingMessages.length > 0) {
    for (const msg of safeIncomingMessages) {
      if (msg.role === 'user') {
        if (msg.parts.length > 0) {
          uiMessages.push({
            id: msg.id,
            role: 'user',
            parts: msg.parts,
          })
        } else if (msg.content) {
          uiMessages.push({
            id: msg.id,
            role: 'user',
            parts: [{ type: 'text' as const, text: msg.content }],
          })
        }

        continue
      }

      if (msg.parts.length > 0) {
        uiMessages.push({
          id: msg.id,
          role: msg.role,
          parts: msg.parts,
        })
      } else if (msg.content) {
        uiMessages.push({
          id: msg.id,
          role: msg.role,
          parts: [{ type: 'text' as const, text: msg.content }],
        })
      }
    }
  }

  if (uiMessages.length === 0 && userMessage) {
    uiMessages.push({
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text' as const, text: userMessage }],
    })
  }

  if (AGENT_DEBUG_LOGS) {
    console.log('[Agent API] uiMessages count:', uiMessages.length)
    console.log('[Agent API] Model being used:', model)
  }

  const usageSteps: LanguageModelUsage[] = []

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      let modelMessages: ModelMessage[] = []

      try {
        modelMessages = await convertToModelMessages(
          uiMessages as Array<
            Omit<UIMessage<unknown, UIDataTypes, UITools>, 'id'>
          >,
          {
            ignoreIncompleteToolCalls: true,
          }
        )
      } catch (_error) {
        modelMessages = [
          {
            role: 'user',
            content:
              typeof userMessage === 'string'
                ? userMessage
                : 'Request context unavailable.',
          },
        ] as ModelMessage[]
      }

      const result = await agent.stream({
        messages: modelMessages,
        onStepFinish: (step) => {
          usageSteps.push(step.usage)

          const { inputTokenDetails } = step.usage
          if (
            inputTokenDetails &&
            (inputTokenDetails.cacheReadTokens ||
              inputTokenDetails.cacheWriteTokens)
          ) {
            console.log('[Agent API] Cache token stats:', {
              cacheReadTokens: inputTokenDetails.cacheReadTokens,
              cacheWriteTokens: inputTokenDetails.cacheWriteTokens,
              inputTokens: step.usage.inputTokens,
              outputTokens: step.usage.outputTokens,
            })
          }
        },
        timeout: {
          totalMs: AGENT_STREAM_TIMEOUT_MS,
          stepMs: AGENT_STREAM_STEP_TIMEOUT_MS,
          chunkMs: AGENT_STREAM_STEP_TIMEOUT_MS,
        },
      })

      writer.merge(
        createJsonRenderPatchGuardStream(
          pipeJsonRender(result.toUIMessageStream())
        )
      )
      await result.consumeStream()

      // Send aggregated usage/cost as a data part so the client can display it
      if (usageSteps.length > 0) {
        const stats = aggregateUsageWithCost(usageSteps, model)
        writer.write({
          type: 'data-usage',
          data: [stats],
        })
      }
    },
    onError: (error) => {
      const classified = classifyError(error)
      classified.model = model
      console.error('[Agent API] Classified error:', classified)
      return JSON.stringify(classified)
    },
    onFinish: () => {
      if (usageSteps.length > 0) {
        const stats = aggregateUsageWithCost(usageSteps, model)
        console.log('[Agent API] Session usage:', stats)
      }
    },
    originalMessages: uiMessages as unknown as UIMessage[],
  })

  return createUIMessageStreamResponse({
    stream,
    headers: {
      'Cache-Control': 'no-cache',
    },
  })
}
