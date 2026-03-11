/**
 * Agent chat API endpoint.
 *
 * This route handles natural language queries from the frontend and routes them
 * through the LangGraph agent system for intent classification, SQL generation,
 * query execution, and response formatting.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * API Contract
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * POST /api/v1/agents/chat
 *
 * Request Body:
 * {
 *   "message": string,        // User's natural language query
 *   "hostId"?: number,        // Host identifier (default: 0)
 *   "history"?: Message[],    // Conversation history for context
 *   "preferences"?: {         // Optional user preferences
 *     "verbose"?: boolean,
 *     "includeSql"?: boolean,
 *     "maxResults"?: number
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "response": {
 *     "content": string,      // Natural language response
 *     "type": string,         // Response type
 *     "data"?: { ... },       // Optional query/data
 *     "suggestions"?: string[] // Follow-up questions
 *   },
 *   "metadata": {
 *     "steps": number,        // Number of agent steps executed
 *     "duration": number,     // Total processing time (ms)
 *     "intent"?: { ... },     // Detected intent
 *     "query"?: { ... }       // Generated query info
 *   }
 * }
 *
 * Error Response:
 * {
 *   "success": false,
 *   "error": {
 *     "message": string,
 *     "type": string
 *   }
 * }
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AgentResponse } from '@/lib/agents/state'

import { NextResponse } from 'next/server'
import { z } from 'zod/v3'
import {
  type AgentMessage,
  createInitialState,
  executeAgent,
} from '@/lib/agents'

/**
 * Request schema for the chat endpoint
 */
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  hostId: z.number().int().min(0).max(100).optional(),
  history: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        timestamp: z.number(),
      })
    )
    .optional(),
  preferences: z
    .object({
      verbose: z.boolean().optional(),
      includeSql: z.boolean().optional(),
      maxResults: z.number().int().min(1).max(1000).optional(),
    })
    .optional(),
})

/**
 * Response schema for successful chat responses
 */
interface ChatResponse {
  readonly success: true
  readonly response: AgentResponse
  readonly metadata: {
    readonly steps: number
    readonly duration: number
    readonly intent?: {
      readonly type: string
      readonly confidence: number
    }
    readonly query?: {
      readonly sql: string
      readonly explanation: string
    }
  }
}

/**
 * Error response schema
 */
interface ChatErrorResponse {
  readonly success: false
  readonly error: {
    readonly message: string
    readonly type: string
  }
}

/**
 * POST handler for agent chat endpoint
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()

    const validationResult = ChatRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              'Invalid request: ' +
              validationResult.error.errors.map((e) => e.message).join(', '),
            type: 'validation_error',
          },
        } satisfies ChatErrorResponse,
        { status: 400 }
      )
    }

    const { message, hostId, history, preferences } = validationResult.data

    // Check for LLM configuration
    const llmConfig = {
      apiKey: process.env.LLM_API_KEY,
      apiBase: process.env.LLM_API_BASE,
      model: process.env.LLM_MODEL,
    }

    if (!llmConfig.apiKey || !llmConfig.apiBase || !llmConfig.model) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              'LLM configuration is missing. Please set LLM_API_KEY, LLM_API_BASE, and LLM_MODEL environment variables.',
            type: 'configuration_error',
          },
        } satisfies ChatErrorResponse,
        { status: 503 }
      )
    }

    // Create initial agent state
    const initialState = createInitialState({
      message,
      hostId,
      history: history as readonly AgentMessage[],
      preferences,
    })

    // Execute agent workflow
    const finalState = await executeAgent(initialState)

    // Extract response and metadata
    const { response, intent, generatedQuery, stepCount } = finalState

    if (!response) {
      throw new Error('Agent completed without generating a response')
    }

    const duration = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        response,
        metadata: {
          steps: stepCount,
          duration,
          intent: intent
            ? {
                type: intent.type,
                confidence: intent.confidence,
              }
            : undefined,
          query: generatedQuery
            ? {
                sql: generatedQuery.sql,
                explanation: generatedQuery.explanation,
              }
            : undefined,
        },
      } satisfies ChatResponse,
      { status: 200 }
    )
  } catch (error) {
    console.error('[Agent Chat] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          type: 'processing_error',
        },
      } satisfies ChatErrorResponse,
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
