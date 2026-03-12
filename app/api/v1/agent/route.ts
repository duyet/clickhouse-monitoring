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
    messages?: Array<{ role: string; content: string; parts?: unknown[] }>
    hostId?: number
    model?: string // Allow client to specify model
  }

  // Support both direct `message` and AI SDK's UIMessage format with parts array
  const lastUserMessage = body.messages?.filter((m) => m.role === 'user')?.pop()

  // Extract from AI SDK UIMessage parts array
  const textPart = lastUserMessage?.parts?.find(
    (p: unknown) =>
      typeof p === 'object' &&
      p !== null &&
      'type' in p &&
      p.type === 'text' &&
      'text' in p
  ) as { type: string; text: string } | undefined

  const userMessage = body.message || textPart?.text || lastUserMessage?.content

  if (!userMessage || typeof userMessage !== 'string') {
    return new Response(
      JSON.stringify({
        error: { message: 'Message is required and must be a string' },
      }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    )
  }

  const hostId = typeof body.hostId === 'number' ? body.hostId : 0
  const model = body.model || process.env.OPENAI_MODEL || 'openrouter/free'

  // Create agent with specified model and host
  const agent = createClickHouseAgent({
    hostId,
    model,
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE,
  })

  // Build UI messages from the user message
  const uiMessages = [
    {
      role: 'user' as const,
      content: userMessage,
    },
  ]

  // Create streaming response using AI SDK
  return createAgentUIStreamResponse({
    agent,
    uiMessages,
    onError: (error) => {
      console.error('[Agent API] Stream error:', error)
      return error instanceof Error
        ? error.message
        : 'An unknown error occurred'
    },
  })
}
