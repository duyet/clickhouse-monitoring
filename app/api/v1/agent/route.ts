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

import { createAgentUIStreamResponse } from 'ai'
import { createClickHouseAgent } from '@/lib/ai/agent'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

/**
 * Handle POST requests for agent processing with streaming
 */
export async function POST(request: Request) {
  // Parse request body
  const body = (await request.json()) as {
    message?: string
    messages?: Array<
      | { id: string; role: string; parts: Array<unknown> }
      | { role: string; content: string; parts?: unknown[] }
    >
    hostId?: number
    model?: string // Allow client to specify model
    disabledTools?: string[] // Tools the user has disabled in the sidebar
  }

  // Debug logging
  console.log('[Agent API] Request body keys:', Object.keys(body))
  console.log('[Agent API] Messages count:', body.messages?.length)
  console.log(
    '[Agent API] Messages sample:',
    body.messages?.slice(-2).map((m) => ({
      role: m.role,
      hasParts: 'parts' in m,
      partsCount: 'parts' in m ? m.parts?.length : 0,
      hasContent: 'content' in m,
      id: 'id' in m ? m.id : undefined,
    }))
  )
  // Log full first message structure for deep debugging
  if (body.messages && body.messages.length > 0) {
    console.log(
      '[Agent API] First message structure:',
      JSON.stringify(body.messages[0], null, 2)
    )
  }

  // Support both direct `message` and AI SDK's UIMessage format with parts array
  const lastUserMessage = body.messages?.filter((m) => m.role === 'user')?.pop()

  // Extract text from parts array (simplified type guard)
  const textPart = lastUserMessage?.parts?.find(
    (p): p is { type: 'text'; text: string } =>
      typeof p === 'object' &&
      p !== null &&
      'type' in p &&
      p.type === 'text' &&
      'text' in p &&
      typeof p.text === 'string'
  )

  // Get message text from various sources (old format for backward compatibility)
  const userMessage =
    body.message ||
    textPart?.text ||
    (lastUserMessage as { content?: string } | undefined)?.content

  // Allow messages with non-text parts (e.g., tool-call only) to proceed
  const hasNonTextParts =
    lastUserMessage?.parts && lastUserMessage.parts.length > 0 && !textPart

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

  const hostId = typeof body.hostId === 'number' ? body.hostId : 0
  const model =
    body.model || process.env.LLM_MODEL || 'stepfun/step-3.5-flash:free'
  const disabledTools = Array.isArray(body.disabledTools)
    ? body.disabledTools.filter((t) => typeof t === 'string')
    : []

  // Create agent with specified model and host
  const agent = createClickHouseAgent({
    hostId,
    model,
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_API_BASE,
    disabledTools,
  })

  // Build UI messages in the correct format for AI SDK v6
  // Forward full conversation history so the LLM has multi-turn context
  const uiMessages: Array<{
    id: string
    role: string
    parts: Array<unknown>
  }> = []

  if (body.messages && body.messages.length > 0) {
    for (const msg of body.messages) {
      // Messages already in UIMessage format (have id + parts)
      if (
        'id' in msg &&
        typeof msg.id === 'string' &&
        'parts' in msg &&
        Array.isArray(msg.parts)
      ) {
        uiMessages.push({
          id: msg.id,
          role: msg.role,
          parts: msg.parts,
        })
      } else if ('content' in msg && typeof msg.content === 'string') {
        // Legacy format: convert to UIMessage
        uiMessages.push({
          id: crypto.randomUUID(),
          role: msg.role,
          parts: [{ type: 'text' as const, text: msg.content }],
        })
      }
    }
  }

  // Fallback: if no messages were parsed, create one from the extracted text
  if (uiMessages.length === 0 && userMessage) {
    uiMessages.push({
      id: crypto.randomUUID(),
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: userMessage }],
    })
  }

  // Debug logging
  console.log(
    '[Agent API] uiMessages being sent:',
    JSON.stringify(uiMessages, null, 2)
  )
  console.log('[Agent API] Model being used:', model)
  console.log('[Agent API] OpenAI baseURL:', process.env.LLM_API_BASE)

  // Create streaming response using AI SDK
  return createAgentUIStreamResponse({
    agent,
    uiMessages,
    onError: (error) => {
      console.error('[Agent API] Stream error:', error)
      console.error('[Agent API] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return error instanceof Error
        ? error.message
        : 'An unknown error occurred'
    },
  })
}
