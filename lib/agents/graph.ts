/**
 * LangGraph state management and workflow definition.
 *
 * This module sets up the LangGraph StateGraph that orchestrates the agent
 * workflow. The graph defines nodes (processing steps) and edges (transitions)
 * that determine how the agent processes user queries.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * LangGraph Architecture Reference
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * StateGraph: Manages state transitions between nodes
 * - Each node receives current state, returns partial state update
 * - Edges define which node executes next based on conditions
 * - StateAnnotation: Typed state schema with update methods
 *
 * Node Pattern:
 * ```typescript
 * async function myNode(state: AgentState): Promise<Partial<AgentState>> {
 *   // Process state
 *   return { /* updated fields *\/ }
 * }
 * ```
 *
 * Conditional Edge Pattern:
 * ```typescript
 * function routeDecision(state: AgentState): string {
 *   return state.intent?.type === 'query' ? 'generateSql' : 'respond'
 * }
 * ```
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { ReactAgentConfig } from './nodes/react-agent'
import type { AgentState } from './state'

import { shouldUseReactAgent } from './nodes/react-agent'

/**
 * Graph configuration options
 */
export interface GraphConfig {
  /** Maximum number of steps to prevent infinite loops */
  readonly maxSteps: number
  /** Enable debug logging */
  readonly debug: boolean
}

/**
 * Default graph configuration
 */
export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  maxSteps: 10,
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Intent classification node
 *
 * Analyzes the user's input to determine what they want to do.
 * This is the first node in most workflows.
 */
export async function intentNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (DEFAULT_GRAPH_CONFIG.debug) {
    console.log('[intentNode] Classifying intent for:', state.userInput)
  }

  // TODO: Integrate with LLM for actual intent classification
  // For now, return a basic classification
  const intent = {
    type: 'unknown' as const,
    confidence: 0.5,
    entities: [] as readonly string[],
  }

  return {
    intent,
    stepCount: state.stepCount + 1,
    messages: [
      ...state.messages,
      {
        id: crypto.randomUUID(),
        role: 'system' as const,
        content: `Intent classified as ${intent.type} with confidence ${intent.confidence}`,
        timestamp: Date.now(),
        metadata: { node: 'intent' },
      },
    ],
  }
}

/**
 * SQL generation node
 *
 * Generates a ClickHouse SQL query based on the user's natural language input.
 * Only executes if the intent is 'query' or 'analysis'.
 *
 * This node uses the text-to-sql implementation which includes:
 * - Schema-aware prompting
 * - LLM integration for SQL generation
 * - SQL validation for security
 */
export async function generateSqlNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (DEFAULT_GRAPH_CONFIG.debug) {
    console.log('[generateSqlNode] Generating SQL for:', state.userInput)
  }

  // Import text-to-sql node dynamically to avoid circular dependencies
  const { textToSqlNode } = await import('./nodes/text-to-sql')

  return textToSqlNode(state, { debug: DEFAULT_GRAPH_CONFIG.debug })
}

/**
 * Query execution node
 *
 * Executes the generated SQL query against ClickHouse.
 * Only executes if a query was generated.
 */
export async function executeQueryNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (DEFAULT_GRAPH_CONFIG.debug) {
    console.log('[executeQueryNode] Executing query')
  }

  // Import fetchData function
  const { fetchData } = await import('@/lib/clickhouse')
  const { validateSqlQuery } = await import('@/lib/api/shared/validators/sql')

  if (!state.generatedQuery) {
    return {
      stepCount: state.stepCount + 1,
    }
  }

  try {
    // Validate SQL before execution
    validateSqlQuery(state.generatedQuery.sql)

    const start = Date.now()

    // Execute the query
    const result = await fetchData({
      query: state.generatedQuery.sql,
      hostId: state.hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    const duration = Date.now() - start

    if (result.error) {
      return {
        queryResult: {
          success: false,
          duration,
          error: result.error.message,
        },
        stepCount: state.stepCount + 1,
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: 'system' as const,
            content: `Query execution failed: ${result.error.message}`,
            timestamp: Date.now(),
            metadata: { node: 'executeQuery' },
          },
        ],
      }
    }

    const rows = (result.data ?? []) as readonly unknown[]

    return {
      queryResult: {
        success: true,
        rows,
        rowCount: rows.length,
        duration,
        metadata: {
          queryId: result.metadata.queryId as string,
          host: result.metadata.host as string,
          clickhouseVersion: result.metadata.clickhouseVersion as string,
        },
      },
      stepCount: state.stepCount + 1,
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'system' as const,
          content: `Query executed successfully. Returned ${rows.length} rows in ${duration}ms.`,
          timestamp: Date.now(),
          metadata: { node: 'executeQuery', rowCount: rows.length, duration },
        },
      ],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (DEFAULT_GRAPH_CONFIG.debug) {
      console.error('[executeQueryNode] Error:', errorMessage)
    }

    return {
      queryResult: {
        success: false,
        duration: 0,
        error: errorMessage,
      },
      stepCount: state.stepCount + 1,
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'system' as const,
          content: `Query execution error: ${errorMessage}`,
          timestamp: Date.now(),
          metadata: { node: 'executeQuery' },
        },
      ],
    }
  }
}

/**
 * Response generation node
 *
 * Generates the final natural language response to the user.
 * This is always the last node in the workflow.
 *
 * If a response was already generated by a previous node (e.g., ReAct agent),
 * it will be preserved. Otherwise, a new response is generated based on
 * the available state (query results, generated queries, etc.).
 */
export async function responseNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (DEFAULT_GRAPH_CONFIG.debug) {
    console.log('[responseNode] Generating response')
  }

  // If we already have a response from a previous node (e.g., ReAct agent),
  // preserve it instead of generating a new one
  if (state.response) {
    if (DEFAULT_GRAPH_CONFIG.debug) {
      console.log('[responseNode] Preserving existing response')
    }
    return {
      stepCount: state.stepCount + 1,
    }
  }

  // Check if we have query results to format
  if (state.queryResult?.success && state.queryResult.rows) {
    const { queryResult, generatedQuery } = state
    const rows = queryResult.rows as readonly unknown[]
    const rowCount = queryResult.rowCount ?? rows.length

    let content = ''

    // Add explanation if available
    if (generatedQuery?.explanation) {
      content += `${generatedQuery.explanation}\n\n`
    }

    // Format result summary
    content += `Query executed successfully in ${queryResult.duration}ms.\n`
    content += `Returned ${rowCount} row${rowCount === 1 ? '' : 's'}.\n\n`

    // Show a preview of the data (first few rows)
    if (rowCount > 0) {
      const previewLimit = 5
      const previewRows = rows.slice(0, previewLimit)

      if (typeof previewRows[0] === 'object' && previewRows[0] !== null) {
        // Get column names from first row
        const columns = Object.keys(previewRows[0] as Record<string, unknown>)

        content += '**Preview of results:**\n'
        content += '```\n'
        // Header
        content += `${columns.join(' | ')}\n`
        content += `${'-'.repeat(Math.min(80, columns.join(' | ').length))}\n`

        // Data rows
        for (const row of previewRows) {
          const values = columns.map((col) => {
            const val = (row as Record<string, unknown>)[col]
            return val === null ? 'NULL' : String(val).slice(0, 20)
          })
          content += `${values.join(' | ')}\n`
        }

        if (rowCount > previewLimit) {
          content += `... and ${rowCount - previewLimit} more row(s)\n`
        }
        content += '```\n\n'
      }
    }

    content +=
      'You can ask me to analyze this data further or run another query.'

    return {
      response: {
        content,
        type: 'query_result',
        data: {
          query: generatedQuery,
          result: queryResult,
        },
        suggestions: [
          'Show me more rows from this result',
          'What patterns do you see in this data?',
          'Run a similar query with different parameters',
        ],
      },
      stepCount: state.stepCount + 1,
    }
  }

  // Check if there was a query error
  if (state.queryResult?.success === false) {
    return {
      response: {
        content: `Query execution failed: ${state.queryResult.error}`,
        type: 'error',
        suggestions: [
          'Check if the query syntax is correct',
          'Verify the tables and columns exist',
          'Try rephrasing your question',
        ],
      },
      stepCount: state.stepCount + 1,
    }
  }

  // Check if we have an error
  if (state.error) {
    return {
      response: {
        content: `An error occurred: ${state.error.message}`,
        type: 'error',
        suggestions: [
          'Please try rephrasing your question',
          'Check if ClickHouse is running and accessible',
          'Ensure LLM_API_KEY is configured for AI features',
        ],
      },
      stepCount: state.stepCount + 1,
    }
  }

  // Default fallback for unrecognized intents or when no other response is available
  const intentType = state.intent?.type ?? 'unknown'
  let content = `I received your message: "${state.userInput}"\n\n`

  if (intentType === 'unknown') {
    content +=
      'I am a ClickHouse monitoring assistant. I can help you:\n\n' +
      '• **Explore schema** - "Show me all tables" or "List databases"\n' +
      '• **Query data** - "What are the slowest queries today?"\n' +
      '• **Monitor metrics** - "Check system health" or "Show running queries"\n' +
      '• **Analyze performance** - "Find large tables" or "Check merge status"\n\n' +
      'Try asking a specific question about your ClickHouse instance!'
  } else {
    content += `I classified your intent as "${intentType}" but I don't have a specific handler for it yet. Try rephrasing your question.`
  }

  return {
    response: {
      content,
      type: 'text',
      suggestions: [
        'Show me all tables',
        'What are the slowest queries?',
        'Check system health',
        'List all databases',
      ],
    },
    stepCount: state.stepCount + 1,
  }
}

/**
 * Error handling node
 *
 * Handles errors that occur during agent processing.
 */
export async function errorNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (DEFAULT_GRAPH_CONFIG.debug) {
    console.log('[errorNode] Handling error')
  }

  const response = {
    content: state.error?.message ?? 'An unknown error occurred',
    type: 'error' as const,
    suggestions: ['Please try rephrasing your question.'] as readonly string[],
  }

  return {
    response,
    stepCount: state.stepCount + 1,
  }
}

/**
 * Routing function after intent classification
 *
 * Determines which node to execute next based on the classified intent.
 * Uses ReAct agent for exploration-style queries, explicit routing for others.
 */
export function routeAfterIntent(state: AgentState): string {
  if (state.error) {
    return 'error'
  }

  if (state.stepCount >= DEFAULT_GRAPH_CONFIG.maxSteps) {
    return 'error'
  }

  // Check if we should use ReAct agent for autonomous tool calling
  const useReactAgent = state.userInput && shouldUseReactAgent(state.userInput)

  if (useReactAgent) {
    return 'reactAgent'
  }

  // Traditional explicit routing
  switch (state.intent?.type) {
    case 'query':
    case 'analysis':
      return 'generateSql'
    default:
      return 'respond'
  }
}

/**
 * Routing function after SQL generation
 *
 * Determines whether to execute the query or respond directly.
 */
export function routeAfterSqlGeneration(state: AgentState): string {
  if (state.error) {
    return 'error'
  }

  if (state.generatedQuery) {
    return 'executeQuery'
  }

  return 'respond'
}

/**
 * Routing function after query execution
 *
 * Always goes to response generation after execution.
 */
export function routeAfterExecution(): string {
  return 'respond'
}

/**
 * Simple agent executor for non-LangGraph execution
 *
 * This is a placeholder implementation that runs the agent workflow
 * without the full LangGraph setup. Will be replaced with proper
 * LangGraph integration once LLM integration is complete.
 */
export async function executeAgent(state: AgentState): Promise<AgentState> {
  let currentState = state

  // Intent classification
  const intentResult = await intentNode(currentState)
  currentState = { ...currentState, ...intentResult }

  // Route based on intent
  const nextNode = routeAfterIntent(currentState)

  if (nextNode === 'reactAgent') {
    // Use ReAct agent for autonomous tool calling
    const reactResult = await AGENT_NODES.reactAgent(currentState)
    return { ...currentState, ...reactResult }
  }

  if (nextNode === 'generateSql') {
    const sqlResult = await generateSqlNode(currentState)
    currentState = { ...currentState, ...sqlResult }

    const afterSqlNode = routeAfterSqlGeneration(currentState)
    if (afterSqlNode === 'executeQuery') {
      const execResult = await executeQueryNode(currentState)
      currentState = { ...currentState, ...execResult }
    }
  }

  // Always end with response
  const responseResult = await responseNode(currentState)
  currentState = { ...currentState, ...responseResult }

  return currentState
}

/**
 * Type for agent node functions
 */
export type AgentNode = (state: AgentState) => Promise<Partial<AgentState>>

/**
 * Registry of all agent nodes
 */
export const AGENT_NODES: Readonly<Record<string, AgentNode>> = {
  intent: intentNode,
  generateSql: generateSqlNode,
  executeQuery: executeQueryNode,
  reactAgent: async (state, config?: ReactAgentConfig) =>
    (await import('./nodes/react-agent')).reactAgentNode(state, config),
  queryAnalyzer: async (state) =>
    (await import('./nodes/query-analyzer')).queryAnalyzerNode(state),
  queryOptimizer: async (state) =>
    (await import('./nodes/query-optimizer')).queryOptimizerNode(state),
  respond: responseNode,
  error: errorNode,
} as const

/**
 * Re-export tools for convenient access
 *
 * LangGraph agents can call these tools to interact with ClickHouse:
 * - Schema exploration: list_databases, list_tables, get_table_schema, search_tables
 * - Query execution: execute_sql, sample_table
 * - Chart data: list_charts, get_chart_data
 * - System metrics: get_metrics, get_running_queries, get_merge_status
 */
export { AGENT_TOOLS } from './tools/registry'
