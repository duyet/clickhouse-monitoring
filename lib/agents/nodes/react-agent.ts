/**
 * ReAct Agent Node for ClickHouse AI Agent
 *
 * This node implements the ReAct (Reasoning + Acting) pattern where the LLM
 * autonomously decides which tools to call based on the user's query.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ReAct Pattern
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The ReAct loop works as follows:
 * 1. THOUGHT: LLM analyzes the user's request
 * 2. ACTION: LLM decides which tool(s) to call with arguments
 * 3. OBSERVATION: Tools execute and return results
 * 4. REPEAT: LLM uses results to continue or answer the user
 *
 * This continues until the LLM has enough information to respond directly.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AgentState } from '../state'

import { AGENT_TOOLS, getAllTools } from '../tools/registry'

/**
 * ReAct agent configuration
 */
export interface ReactAgentConfig {
  /** Maximum number of LLM/tool iterations */
  readonly maxIterations?: number
  /** Enable debug logging */
  readonly debug?: boolean
}

/**
 * Default ReAct agent configuration
 */
export const DEFAULT_REACT_CONFIG: ReactAgentConfig = {
  maxIterations: 10,
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Create a ChatOpenAI instance for ReAct agent
 *
 * Uses OpenRouter as the provider, allowing access to multiple LLMs
 * including free models.
 */
async function createLLM() {
  const { ChatOpenAI } = await import('@langchain/openai')
  const { OPENROUTER_CONFIG } = await import('../llm/openrouter')

  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    throw new Error(
      'LLM_API_KEY environment variable is required for ReAct agent'
    )
  }

  const config = OPENROUTER_CONFIG(apiKey)

  return new ChatOpenAI({
    ...config,
    modelName: process.env.LLM_MODEL || 'openrouter/free',
    temperature: 0.7,
    maxTokens: 4096,
  })
}

/**
 * ReAct agent node
 *
 * This node implements an autonomous agent that can:
 * - Understand natural language queries
 * - Decide which ClickHouse tools to call
 * - Interpret tool results and continue reasoning
 * - Generate final responses
 *
 * @param state - Current agent state with user input
 * @param config - Agent configuration options
 * @returns Updated agent state with response
 */
export async function reactAgentNode(
  state: AgentState,
  config: ReactAgentConfig = DEFAULT_REACT_CONFIG
): Promise<Partial<AgentState>> {
  const { maxIterations = 10, debug = false } = config
  const startTime = Date.now()

  if (debug) {
    console.log('[reactAgentNode] Starting ReAct agent with tools:', {
      tools: Object.keys(AGENT_TOOLS),
      userInput: state.userInput?.slice(0, 100),
    })
  }

  try {
    // Import LangGraph dependencies dynamically
    const { StateGraph } = await import('@langchain/langgraph')
    const { ToolNode } = await import('@langchain/langgraph/prebuilt')
    const { HumanMessage, AIMessage, SystemMessage, ToolMessage } =
      await import('@langchain/core/messages')

    // Get all tools as an array
    const tools = getAllTools()

    // Create LLM with tools bound
    const llm = await createLLM()
    const llmWithTools = llm.bindTools(tools)

    // Create tool node for executing tools
    const toolNode = new ToolNode(tools)

    // Build ReAct loop - collect initial messages
    const systemMessage = new SystemMessage(
      `You are a ClickHouse database monitoring assistant. You can help users:` +
        `\n\n` +
        `• Explore database schema (list databases, tables, columns)` +
        `\n• Execute SQL queries safely` +
        `\n• Monitor system metrics (queries, merges, disk usage)` +
        `\n• Analyze performance trends` +
        `\n• Generate insights and recommendations` +
        `\n\n` +
        `Available tools:` +
        `\n• list_databases - List all databases` +
        `\n• list_tables - List tables in a database with sizes` +
        `\n• get_table_schema - Get column definitions for a table` +
        `\n• search_tables - Search tables by pattern` +
        `\n• execute_sql - Execute SELECT queries (validated for safety)` +
        `\n• sample_table - Get sample rows from a table` +
        `\n• get_metrics - Server health metrics` +
        `\n• get_running_queries - Currently executing queries` +
        `\n• get_merge_status - Active merge operations` +
        `\n• list_charts - List available monitoring charts` +
        `\n• get_chart_data - Get data for a specific chart` +
        `\n\n` +
        `Guidelines:` +
        `\n• Always use tools to gather data before answering` +
        `\n• For schema questions, use list_databases → list_tables → get_table_schema` +
        `\n• For data questions, use execute_sql or sample_table` +
        `\n• For metrics, use get_metrics, get_running_queries, get_merge_status` +
        `\n• Be specific with tool parameters (e.g., database name, table name)` +
        `\n• If a tool fails, explain why and suggest alternatives` +
        `\n• When showing data, summarize key insights (not just raw output)` +
        `\n\n` +
        `Current host ID: ${state.hostId || 0}`
    )

    // Build initial message array with system message and user message
    // Type note: Using `any[]` here because LangChain message types are dynamically imported
    // and TypeScript cannot easily infer the union type. Runtime safety is maintained
    // by LangChain's validation and the LLM's tool calling mechanism.
    const messages: any[] = []

    messages.push(systemMessage)

    // Add user message if available
    if (state.userInput) {
      messages.push(new HumanMessage(state.userInput))
    } else if (state.messages.length > 0) {
      // Use last message as user input
      const lastMsg = state.messages[state.messages.length - 1]
      if (lastMsg.content) {
        messages.push(new HumanMessage(lastMsg.content))
      }
    }

    // ReAct loop: continue until LLM stops calling tools
    let iteration = 0
    let lastResponse: any = null

    while (iteration < maxIterations) {
      iteration++

      if (debug) {
        console.log(`[reactAgentNode] Iteration ${iteration}/${maxIterations}`)
      }

      // Invoke LLM with current message history
      const response = await llmWithTools.invoke(messages)

      if (debug && response.tool_calls?.length) {
        console.log(
          `[reactAgentNode] Tool calls:`,
          response.tool_calls.map(
            (tc) => `${tc.name}(${JSON.stringify(tc.args)})`
          )
        )
      }

      // Add AI response to message history
      messages.push(response)
      lastResponse = response

      // Check if LLM wants to call tools
      if (!response.tool_calls || response.tool_calls.length === 0) {
        // No more tool calls - LLM is ready to respond
        if (debug) {
          console.log('[reactAgentNode] LLM finished reasoning')
        }
        break
      }

      // Execute tool calls
      const toolResults: any[] = []
      for (const toolCall of response.tool_calls) {
        try {
          const result = await toolNode.invoke({
            messages,
          })

          // Extract tool result content
          const toolMessage = new ToolMessage({
            content: JSON.stringify(result),
            tool_call_id: toolCall.id!, // Tool calls from LLM always have IDs
          })

          toolResults.push(toolMessage)

          if (debug) {
            console.log(
              `[reactAgentNode] Tool ${toolCall.name} returned:`,
              typeof result === 'string'
                ? result.slice(0, 100)
                : 'complex result'
            )
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'

          const toolMessage = new ToolMessage({
            content: JSON.stringify({ error: errorMessage }),
            tool_call_id: toolCall.id!, // Tool calls from LLM always have IDs
          })

          toolResults.push(toolMessage)

          if (debug) {
            console.log(
              `[reactAgentNode] Tool ${toolCall.name} failed:`,
              errorMessage
            )
          }
        }
      }

      // Add tool results to message history
      messages.push(...toolResults)
    }

    // Check if we exceeded max iterations
    if (iteration >= maxIterations && lastResponse?.tool_calls?.length) {
      return {
        response: {
          content: `I need more steps to answer your question, but I've reached the maximum number of iterations (${maxIterations}). Please try a more specific question.`,
          type: 'error',
          suggestions: [
            'Try breaking down your question into smaller parts',
            "Be more specific about which database or table you're interested in",
          ],
        },
        stepCount: state.stepCount + 1,
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: `ReAct agent exceeded max iterations (${maxIterations})`,
            timestamp: Date.now(),
            metadata: { node: 'reactAgent', iterations: iteration },
          },
        ],
      }
    }

    // Extract final response
    const finalContent = lastResponse?.content || 'No response generated'
    const duration = Date.now() - startTime

    if (debug) {
      console.log(
        `[reactAgentNode] Completed in ${duration}ms, ${iteration} iterations`
      )
    }

    // Return formatted response
    return {
      response: {
        content: finalContent,
        type: 'text',
        suggestions: [],
      },
      stepCount: state.stepCount + 1,
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: finalContent,
          timestamp: Date.now(),
          metadata: {
            node: 'reactAgent',
            iterations: iteration,
            duration,
          },
        },
      ],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (debug) {
      console.error('[reactAgentNode] Error:', errorMessage)
    }

    return {
      response: {
        content: `I encountered an error while processing your request: ${errorMessage}`,
        type: 'error',
        suggestions: [
          'Check your question and try again',
          'Ensure ClickHouse is running and accessible',
          'Try a simpler question to diagnose the issue',
        ],
      },
      error: {
        message: errorMessage,
        node: 'reactAgent',
        recoverable: true,
      },
      stepCount: state.stepCount + 1,
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `ReAct agent error: ${errorMessage}`,
          timestamp: Date.now(),
          metadata: { node: 'reactAgent', error: errorMessage },
        },
      ],
    }
  }
}

/**
 * Quick check if ReAct agent should be used for the given input
 *
 * Returns true if the input seems to benefit from tool exploration.
 */
export function shouldUseReactAgent(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase()

  // Keywords that suggest need for tool exploration
  const toolExplorationKeywords = [
    'show me',
    'list',
    'what',
    'how many',
    'which',
    'find',
    'search',
    'explore',
    'check',
    'monitor',
    'status',
    'metrics',
    'running',
    'queries',
    'tables',
    'databases',
    'schema',
    'sample',
    'data',
  ]

  // Keywords that suggest simple direct queries
  const directQueryKeywords = ['explain', 'optimize', 'analyze', 'recommend']

  const hasToolKeyword = toolExplorationKeywords.some((kw) =>
    lowerInput.includes(kw)
  )
  const hasDirectKeyword = directQueryKeywords.some((kw) =>
    lowerInput.includes(kw)
  )

  // Prefer ReAct for exploration-style queries
  return hasToolKeyword || !hasDirectKeyword
}
