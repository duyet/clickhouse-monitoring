/**
 * AI Agent API Endpoint
 *
 * POST /api/v1/agent
 *
 * Processes natural language queries through the LangGraph agent workflow.
 * Handles text-to-SQL conversion, query execution, and response generation.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Request/Response Format
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Request:
 * {
 *   "message": "Show me the 10 slowest queries",
 *   "hostId": 0,
 *   "history": [...],  // Optional conversation history
 *   "preferences": {...}  // Optional user preferences
 * }
 *
 * Response:
 * {
 *   "response": {...},  // AgentResponse
 *   "messages": [...],  // Updated conversation history
 *   "generatedQuery": {...},  // If SQL was generated
 *   "queryResult": {...},  // If query was executed
 * }
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { CreateAgentStateInput } from '@/lib/agents/state'
import type { ApiRequest } from '@/lib/api/types'

import { executeAgent } from '@/lib/agents/graph'
import { createInitialState } from '@/lib/agents/state'
import {
  createErrorResponse as createApiErrorResponse,
  createValidationError,
  withApiHandler,
} from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { getAndValidateHostId } from '@/lib/api/shared/validators'
import { ApiErrorType } from '@/lib/api/types'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/agent' }

/**
 * Handle POST requests for agent processing
 *
 * @example
 * POST /api/v1/agent
 * {
 *   "message": "Show me the 10 slowest queries from today",
 *   "hostId": 0
 * }
 */
export const POST = withApiHandler(async (request: Request) => {
  // Parse request body
  const body = (await request.json()) as Partial<AgentRequestBody>

  // Validate required fields
  if (!body.message || typeof body.message !== 'string') {
    return createValidationError('Message is required and must be a string', {
      ...ROUTE_CONTEXT,
      method: 'POST',
    })
  }

  // Get and validate hostId
  let hostId: number
  if (body.hostId !== undefined) {
    const params = new URLSearchParams()
    params.set('hostId', String(body.hostId))
    const hostIdResult = getAndValidateHostId(params)
    if (typeof hostIdResult !== 'number') {
      return createValidationError(hostIdResult.message, {
        ...ROUTE_CONTEXT,
        method: 'POST',
      })
    }
    hostId = hostIdResult
  } else {
    hostId = 0
  }

  // Create initial agent state
  const stateInput: CreateAgentStateInput = {
    message: body.message,
    hostId,
    history: body.history,
    preferences: body.preferences,
  }

  const initialState = createInitialState(stateInput)

  try {
    // Execute the agent workflow
    const finalState = await executeAgent(initialState)

    // Return successful response
    return createSuccessResponse(
      {
        response: finalState.response,
        messages: finalState.messages,
        generatedQuery: finalState.generatedQuery,
        queryResult: finalState.queryResult,
        intent: finalState.intent,
      },
      {
        duration: Date.now() - finalState.startedAt,
      }
    )
  } catch (error) {
    // Handle execution errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
      },
      500,
      { ...ROUTE_CONTEXT, method: 'POST', hostId }
    )
  }
}, ROUTE_CONTEXT)

/**
 * Request body type for agent endpoint
 */
interface AgentRequestBody {
  /** User's natural language message */
  readonly message: string
  /** ClickHouse host identifier */
  readonly hostId?: number
  /** Optional conversation history */
  readonly history?: readonly {
    readonly id: string
    readonly role: 'user' | 'assistant' | 'system'
    readonly content: string
    readonly timestamp: number
    readonly metadata?: {
      readonly node?: string
      readonly [key: string]: unknown
    }
  }[]
  /** Optional user preferences */
  readonly preferences?: {
    readonly verbose?: boolean
    readonly includeSql?: boolean
    readonly maxResults?: number
  }
}
