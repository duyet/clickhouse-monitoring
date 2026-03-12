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

  if (!userMessage || typeof userMessage !== 'string') {
    return new Response(
      JSON.stringify({
        error: { message: 'Message is required and must be a string' },
      }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    )
  }

  const hostId = typeof body.hostId === 'number' ? body.hostId : 0
  const model = body.model || process.env.LLM_MODEL || 'openrouter/free'

  // Create agent with specified model and host
  const agent = createClickHouseAgent({
    hostId,
    model,
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_API_BASE,
  })

  // Build UI messages in the correct format for AI SDK v6
  // If client sent proper UIMessage format, preserve it; otherwise create new
  const uiMessages =
    lastUserMessage &&
    typeof lastUserMessage === 'object' &&
    'id' in lastUserMessage &&
    'parts' in lastUserMessage &&
    Array.isArray(lastUserMessage.parts)
      ? [lastUserMessage as { id: string; role: 'user'; parts: Array<unknown> }]
      : [
          {
            id: crypto.randomUUID(),
            role: 'user' as const,
            parts: [{ type: 'text' as const, text: userMessage }],
          },
        ]

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
