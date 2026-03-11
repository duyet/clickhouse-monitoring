/**
 * Central tool registry for LangGraph agents.
 *
 * This module exports all available tools that LLMs can call when interacting
 * with ClickHouse. Tools are organized by category and exported both individually
 * and as a complete collection for easy binding to LLMs.
 *
 * Usage:
 * ```typescript
 * import { AGENT_TOOLS } from '@/lib/agents/tools/registry'
 * import { bindTools } from '@langchain/core/runnaries'
 *
 * const llmWithTools = llm.bindTools(Object.values(AGENT_TOOLS))
 * ```
 */

// Chart data tools
export { getChartDataTool, listChartsTool } from './chart'
// Query execution tools
export { executeSqlTool, sampleTableTool } from './query'
// Schema exploration tools
export {
  getTableSchemaTool,
  listDatabasesTool,
  listTablesTool,
  searchTablesTool,
} from './schema'
// System metrics tools
export {
  getMergeStatusTool,
  getMetricsTool,
  getRunningQueriesTool,
} from './system'

/**
 * Complete registry of all LangGraph agent tools.
 *
 * Tools are organized by name for LLM discovery. Each tool has:
 * - name: Identifier for LLM tool calling
 * - description: Self-documentation for LLM
 * - schema: Zod schema for validation
 * - callable: Async function that executes the tool
 *
 * To add new tools:
 * 1. Create tool file in appropriate category directory
 * 2. Export from category index.ts
 * 3. Add to this registry
 */
export const AGENT_TOOLS = {
  // Schema exploration tools
  list_databases: (await import('./schema/list-databases')).listDatabasesTool,
  list_tables: (await import('./schema/list-tables')).listTablesTool,
  get_table_schema: (await import('./schema/get-table-schema'))
    .getTableSchemaTool,
  search_tables: (await import('./schema/search-tables')).searchTablesTool,

  // Query execution tools
  execute_sql: (await import('./query/execute-sql')).executeSqlTool,
  sample_table: (await import('./query/sample-table')).sampleTableTool,

  // Chart data tools
  list_charts: (await import('./chart/list-charts')).listChartsTool,
  get_chart_data: (await import('./chart/get-chart-data')).getChartDataTool,

  // System metrics tools
  get_metrics: (await import('./system/get-metrics')).getMetricsTool,
  get_running_queries: (await import('./system/get-running-queries'))
    .getRunningQueriesTool,
  get_merge_status: (await import('./system/get-merge-status'))
    .getMergeStatusTool,
} as const

/**
 * Type definition for tool names in the registry
 */
export type AgentToolName = keyof typeof AGENT_TOOLS

/**
 * Get a specific tool by name
 */
export function getTool(name: AgentToolName) {
  return AGENT_TOOLS[name]
}

/**
 * Get all tools as an array (useful for binding to LLM)
 */
export function getAllTools() {
  return Object.values(AGENT_TOOLS)
}

/**
 * Get tool names (useful for logging/debugging)
 */
export function getToolNames(): readonly string[] {
  return Object.keys(AGENT_TOOLS)
}

/**
 * Get tools by category
 */
export function getToolsByCategory(
  category: 'schema' | 'query' | 'chart' | 'system'
) {
  const categoryTools: Record<string, AgentToolName[]> = {
    schema: [
      'list_databases',
      'list_tables',
      'get_table_schema',
      'search_tables',
    ],
    query: ['execute_sql', 'sample_table'],
    chart: ['list_charts', 'get_chart_data'],
    system: ['get_metrics', 'get_running_queries', 'get_merge_status'],
  }

  return categoryTools[category].map((name) => AGENT_TOOLS[name])
}
