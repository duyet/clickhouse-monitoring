/**
 * ClickHouse AI Agent using AI SDK ToolLoopAgent
 *
 * A native AI SDK agent for querying ClickHouse using natural language.
 * Replaces the LangGraph-based agent with simpler, more efficient architecture.
 */

import { createMcpTools } from './mcp-tool-adapter'
import { createOpenAI } from '@ai-sdk/openai'
import { stepCountIs, ToolLoopAgent } from 'ai'

/**
 * Default model configuration
 */
const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_MAX_STEPS = 10

/**
 * Create a ClickHouse agent with the specified model and configuration
 */
export function createClickHouseAgent(options: {
  /**
   * The model to use for the agent (e.g., 'gpt-4o-mini', 'gpt-4o')
   */
  model?: string

  /**
   * OpenAI API key (falls back to OPENAI_API_KEY env var)
   */
  apiKey?: string

  /**
   * Base URL for OpenAI API (for custom endpoints)
   */
  baseURL?: string

  /**
   * Maximum number of tool execution steps
   */
  maxSteps?: number

  /**
   * ClickHouse host ID to query
   */
  hostId: number
}) {
  const {
    model = DEFAULT_MODEL,
    apiKey,
    baseURL,
    maxSteps = DEFAULT_MAX_STEPS,
    hostId,
  } = options

  // Create OpenAI provider
  const openai = createOpenAI({
    apiKey,
    baseURL: baseURL || process.env.OPENAI_API_BASE,
  })

  // Get the model instance
  const modelInstance = openai(model)

  // Get tools for this host
  const tools = createMcpTools(hostId)

  // Build instructions as a plain string to avoid escaping issues
  const instructions = `You are a ClickHouse database expert assistant. Your role is to help users analyze their ClickHouse databases through natural language queries.

## Available Tools

You have access to the following tools:
- query: Execute SQL queries (SELECT only)
- list_databases: List all databases
- list_tables: List tables in a database
- get_table_schema: Get column definitions for a table
- get_metrics: Get server metrics (version, uptime, connections, memory)
- get_running_queries: Show currently executing queries
- get_slow_queries: Show slowest completed queries
- get_merge_status: Show active merge operations

## Best Practices

1. Start with exploration: Use list_databases and list_tables to understand the schema
2. Get schema before querying: Use get_table_schema to understand columns before writing complex queries
3. Check system state: Use get_metrics to understand server health
4. Use simple queries first: Start with query for simple SELECTs, then iterate
5. Analyze performance: Use get_running_queries and get_slow_queries to find bottlenecks

## SQL Guidelines

- Only use SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
- Use formatReadableSize() for human-readable byte values
- Use substring(query, 1, 200) to truncate long query text
- Query system tables like system.tables, system.columns, system.processes, system.query_log, system.merges
- Use parameterized queries with {param:Type} syntax when accepting user input

## Response Format

1. Always explain what you're doing before calling tools
2. Show SQL queries when using the query tool
3. Present results in clear, readable format (tables, lists, bullet points)
4. Provide insights and analysis based on the data
5. Suggest follow-up queries when relevant

## Example Interactions

User: "Show me all databases"
You: "I'll list all databases in your ClickHouse cluster." → Call list_databases

User: "What are the largest tables?"
You: "I'll check the tables by size. First, let me get the databases." → list_databases → list_tables with database

User: "Show slow queries"
You: "I'll retrieve the slowest completed queries from the query log." → Call get_slow_queries

Remember: Be helpful, be thorough, and always explain what you're doing.`

  // Create the agent
  const agent = new ToolLoopAgent({
    id: 'clickhouse-agent',
    model: modelInstance,
    tools,
    instructions,
    stopWhen: stepCountIs(maxSteps),
  })

  return agent
}
