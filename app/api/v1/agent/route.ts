/**
 * AI Agent API Endpoint (Streaming)
 *
 * POST /api/v1/agent
 *
 * Processes natural language queries through the agent workflow
 * and streams results back using the Vercel AI SDK's UI Message Stream format.
 * This enables the frontend `useChat` hook to consume events in real-time,
 * including tool call rendering.
 */

import type { UIMessageStreamWriter } from 'ai'
import type {
  ReactAgentConfig,
  ToolStreamCallback,
  ToolStreamEvent,
} from '@/lib/agents/nodes/react-agent'
import type { CreateAgentStateInput } from '@/lib/agents/state'

import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import {
  executeQueryNode,
  generateSqlNode,
  intentNode,
  responseNode,
  routeAfterIntent,
  routeAfterSqlGeneration,
} from '@/lib/agents/graph'
import { reactAgentNode } from '@/lib/agents/nodes/react-agent'
import { createInitialState } from '@/lib/agents/state'

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

  // Create initial agent state
  const stateInput: CreateAgentStateInput = {
    message: userMessage,
    hostId,
  }

  const initialState = createInitialState(stateInput)

  // Create streaming response using AI SDK
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      await executeAgentWithStream(initialState, writer)
    },
    onError: (error) => {
      console.error('[Agent API] Stream error:', error)
      return error instanceof Error
        ? error.message
        : 'An unknown error occurred'
    },
  })

  return createUIMessageStreamResponse({ stream })
}

/**
 * Execute the agent workflow, streaming events to the writer at each step.
 */
async function executeAgentWithStream(
  state: import('@/lib/agents/state').AgentState,
  writer: UIMessageStreamWriter
) {
  let currentState = state
  const textId = crypto.randomUUID()

  // Step 1: Intent classification
  const intentResult = await intentNode(currentState)
  currentState = { ...currentState, ...intentResult }

  // Route based on intent
  const nextNode = routeAfterIntent(currentState)

  if (nextNode === 'reactAgent') {
    // Use ReAct agent for autonomous tool calling
    // Stream tool calls as they happen using the onToolEvent callback
    try {
      // Create a stream callback that writes to the AI SDK stream
      const streamCallback: ToolStreamCallback = async (
        event: ToolStreamEvent
      ) => {
        switch (event.type) {
          case 'tool-input-start':
            writer.write({
              type: 'tool-input-start',
              toolCallId: event.toolCallId,
              toolName: event.toolName,
            } as any)
            break

          case 'tool-input-available':
            writer.write({
              type: 'tool-input-available',
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              input: event.input,
            } as any)
            break

          case 'tool-output-streaming':
            writer.write({
              type: 'tool-output-streaming',
              toolCallId: event.toolCallId,
              toolName: event.toolName,
            } as any)
            break

          case 'tool-output-available':
            writer.write({
              type: 'tool-output-available',
              toolCallId: event.toolCallId,
              output: event.output,
            } as any)
            break

          case 'tool-output-error':
            writer.write({
              type: 'tool-output-error',
              toolCallId: event.toolCallId,
              errorText: event.error ?? 'Unknown error',
            })
            break
        }
      }

      // Execute ReAct agent with streaming callback
      const reactConfig: ReactAgentConfig = {
        onToolEvent: streamCallback,
      }
      const reactResult = await reactAgentNode(currentState, reactConfig)

      currentState = { ...currentState, ...reactResult }
    } catch (error) {
      writer.write({
        type: 'error',
        errorText:
          error instanceof Error ? error.message : 'ReAct agent failed',
      })
      return
    }
  }

  if (nextNode === 'generateSql') {
    // Step 2: SQL generation
    const sqlToolCallId = crypto.randomUUID()

    // Start tool call for SQL generation
    writer.write({
      type: 'tool-input-start',
      toolCallId: sqlToolCallId,
      toolName: 'generate_sql',
    })

    const sqlResult = await generateSqlNode(currentState)
    currentState = { ...currentState, ...sqlResult }

    if (currentState.generatedQuery) {
      // Emit the tool input (the generated SQL)
      writer.write({
        type: 'tool-input-available',
        toolCallId: sqlToolCallId,
        toolName: 'generate_sql',
        input: {
          sql: currentState.generatedQuery.sql,
          explanation: currentState.generatedQuery.explanation,
          tables: currentState.generatedQuery.tables,
        },
      })

      // Route after SQL generation
      const afterSqlNode = routeAfterSqlGeneration(currentState)

      if (afterSqlNode === 'executeQuery') {
        // Step 3: Query execution
        const execToolCallId = crypto.randomUUID()

        writer.write({
          type: 'tool-input-available',
          toolCallId: execToolCallId,
          toolName: 'execute_sql',
          input: { sql: currentState.generatedQuery.sql },
        })

        const execResult = await executeQueryNode(currentState)
        currentState = { ...currentState, ...execResult }

        if (currentState.queryResult) {
          if (currentState.queryResult.success) {
            writer.write({
              type: 'tool-output-available',
              toolCallId: execToolCallId,
              output: {
                rows: currentState.queryResult.rows,
                rowCount: currentState.queryResult.rowCount,
                duration: currentState.queryResult.duration,
              },
            })
          } else {
            writer.write({
              type: 'tool-output-error',
              toolCallId: execToolCallId,
              errorText: currentState.queryResult.error || 'Query failed',
            })
          }
        }
      }
    } else {
      // SQL generation produced no query
      writer.write({
        type: 'tool-output-error',
        toolCallId: sqlToolCallId,
        errorText: 'Could not generate SQL for this query',
      })
    }
  }

  // Step 4: Response generation - stream as text
  const responseResult = await responseNode(currentState)
  currentState = { ...currentState, ...responseResult }

  const responseContent =
    currentState.response?.content ||
    'I received your message. The agent infrastructure is still being set up.'

  // Stream the response text
  writer.write({ type: 'text-start', id: textId })
  writer.write({ type: 'text-delta', id: textId, delta: responseContent })
  writer.write({ type: 'text-end', id: textId })
}
