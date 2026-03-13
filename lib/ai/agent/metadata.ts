/**
 * Client-side tool metadata for display in the AI Agents sidebar.
 *
 * This file contains only display information (names, descriptions, categories)
 * without importing the actual tool functions which depend on server-side code.
 */

export interface ToolMetadata {
  readonly name: string
  readonly description: string
  readonly category: 'schema' | 'query' | 'chart' | 'system'
}

export const TOOLS_METADATA: readonly ToolMetadata[] = [
  // Schema tools
  {
    name: 'list_databases',
    description: 'List all databases in the ClickHouse cluster',
    category: 'schema',
  },
  {
    name: 'list_tables',
    description: 'List all tables in a database',
    category: 'schema',
  },
  {
    name: 'get_table_schema',
    description: 'Get the schema (columns, types) of a specific table',
    category: 'schema',
  },
  {
    name: 'search_tables',
    description: 'Search for tables by name pattern across all databases',
    category: 'schema',
  },
  // Query tools
  {
    name: 'execute_sql',
    description: 'Execute a custom SQL query and return results',
    category: 'query',
  },
  {
    name: 'sample_table',
    description: 'Get a sample of rows from a table',
    category: 'query',
  },
  // Chart tools
  {
    name: 'list_charts',
    description: 'List all available monitoring charts',
    category: 'chart',
  },
  {
    name: 'get_chart_data',
    description: 'Get data from a specific monitoring chart',
    category: 'chart',
  },
  // System tools
  {
    name: 'get_metrics',
    description: 'Get current server metrics (CPU, memory, connections)',
    category: 'system',
  },
  {
    name: 'get_running_queries',
    description: 'List all currently running queries',
    category: 'system',
  },
  {
    name: 'get_merge_status',
    description: 'Get status of active merge operations',
    category: 'system',
  },
  {
    name: 'load_skill',
    description:
      'Load specialized knowledge (best practices, optimization guides)',
    category: 'system',
  },
] as const

export interface ToolCategory {
  readonly name: string
  readonly tools: readonly string[]
  readonly icon: string
}

export const TOOL_CATEGORIES: readonly ToolCategory[] = [
  {
    name: 'Schema',
    tools: [
      'list_databases',
      'list_tables',
      'get_table_schema',
      'search_tables',
    ],
    icon: '📊',
  },
  {
    name: 'Query',
    tools: ['execute_sql', 'sample_table'],
    icon: '🔍',
  },
  {
    name: 'Chart',
    tools: ['list_charts', 'get_chart_data'],
    icon: '📈',
  },
  {
    name: 'System',
    tools: [
      'get_metrics',
      'get_running_queries',
      'get_merge_status',
      'load_skill',
    ],
    icon: '⚙️',
  },
] as const

export const SUGGESTED_PROMPTS = [
  'What databases are available and which ones have the most tables?',
  'Show me the 10 largest tables and their disk usage',
  'Which queries are running right now and how long have they been executing?',
  'What are the slowest queries from the past 24 hours?',
  'How is the merge queue performing? Are there any large merges stuck?',
  'What is the current CPU, memory, and disk usage of this server?',
  'Show me replication lag across all replica tables',
  'Which users are consuming the most resources?',
  'Are there any long-running queries that should be killed?',
  'What are the most frequently accessed tables recently?',
] as const

/**
 * Get tool metadata by name
 */
export function getToolMetadata(name: string): ToolMetadata | undefined {
  return TOOLS_METADATA.find((tool) => tool.name === name)
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolMetadata['category']) {
  return TOOLS_METADATA.filter((tool) => tool.category === category)
}
